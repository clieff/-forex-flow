import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { rateUpdateSchema } from "@/lib/validation";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";
import { createLog } from "@/lib/logs";
import { isAdminRole } from "@/lib/roles";

export async function GET() {
  const { user } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });

  return NextResponse.json({ currencies });
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rl = await checkRateLimit({ key: `rates:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { user } = await getServerSession();

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = rateUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.currency.findUnique({
    where: { code: parsed.data.currencyCode }
  });

  if (!existing) {
    return NextResponse.json({ error: "Currency not found" }, { status: 404 });
  }

  const nextBuy = new Prisma.Decimal(parsed.data.buyRate);
  const nextSell = new Prisma.Decimal(parsed.data.sellRate);

  await prisma.$transaction([
    prisma.currency.update({
      where: { code: parsed.data.currencyCode },
      data: {
        buyRate: nextBuy,
        sellRate: nextSell
      }
    }),
    prisma.rateHistory.create({
      data: {
        currencyCode: parsed.data.currencyCode,
        oldBuyRate: existing.buyRate,
        newBuyRate: nextBuy,
        oldSellRate: existing.sellRate,
        newSellRate: nextSell,
        changedById: user.id
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/rates");
  revalidatePath("/logs");

  await createLog({
    category: "RATE",
    action: "UPDATE_RATE",
    details: `${parsed.data.currencyCode}: Buy ${existing.buyRate}->${nextBuy}, Sell ${existing.sellRate}->${nextSell}`,
    userId: user.id
  });

  return NextResponse.json({ ok: true });
}
