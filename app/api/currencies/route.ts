import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createLog } from "@/lib/logs";
import { currencySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = currencySchema.safeParse({
      ...body,
      buyRate: Number(body.buyRate),
      sellRate: Number(body.sellRate)
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { code, name, flagCode, buyRate, sellRate } = parsed.data;

    const existing = await prisma.currency.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: "Cette devise existe deja." }, { status: 400 });
    }

    const currency = await prisma.currency.create({
      data: {
        code,
        name,
        flagCode,
        buyRate,
        sellRate
      }
    });

    await createLog({
      category: "RATE",
      action: "CREATE_CURRENCY",
      details: `Nouvelle devise ajoutee: ${currency.code} (${currency.name})`,
      userId: session.user.id
    });

    return NextResponse.json(currency);
  } catch (error) {
    console.error("Error creating currency:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function GET() {
  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });
  return NextResponse.json(currencies);
}
