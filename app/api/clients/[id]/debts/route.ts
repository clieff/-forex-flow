import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { updateClientDebt } from "@/lib/debt";
import { clientDebtAdjustmentSchema } from "@/lib/validation";
import { createLog } from "@/lib/logs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clientDebtAdjustmentSchema.safeParse({
    ...body,
    amount: Number(body.amount)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { id: true, name: true }
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const signedAmount = parsed.data.operation === "INCREASE" ? parsed.data.amount : -parsed.data.amount;

  const debt = await updateClientDebt(
    client.id,
    parsed.data.currencyCode,
    signedAmount,
    parsed.data.note || undefined
  );

  await createLog({
    category: "TRANSACTION",
    action: "CLIENT_DEBT_UPDATE",
    details: `${client.name} ${parsed.data.currencyCode}: ${signedAmount > 0 ? "+" : ""}${signedAmount}`,
    userId: user.id
  });

  return NextResponse.json({ debt });
}
