import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { clientRateSchema } from "@/lib/validation";
import { isAdminRole } from "@/lib/roles";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clientRateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rate = await prisma.clientRate.upsert({
    where: {
      clientId_currencyCode: {
        clientId: params.id,
        currencyCode: parsed.data.currencyCode
      }
    },
    update: {
      buyRate: parsed.data.buyRate,
      sellRate: parsed.data.sellRate
    },
    create: {
      clientId: params.id,
      currencyCode: parsed.data.currencyCode,
      buyRate: parsed.data.buyRate,
      sellRate: parsed.data.sellRate
    }
  });

  return NextResponse.json(rate);
}
