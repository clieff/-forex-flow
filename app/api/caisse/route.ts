import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCaisseData } from "@/lib/caisse";
import { createLog } from "@/lib/logs";
import { isAdminRole } from "@/lib/roles";

const cashMovementSchema = z.object({
  direction: z.enum(["IN", "OUT"]),
  amount: z.number().positive("Le montant doit être positif"),
  reason: z.enum(["DEPOT", "RETRAIT", "DEPENSE", "AJUSTEMENT", "AUTRE"]),
  note: z.string().max(200).optional().or(z.literal(""))
});

export async function GET() {
  const { user } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCaisseData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user } = await getServerSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = cashMovementSchema.safeParse({
    ...body,
    amount: Number(body.amount)
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const movement = await prisma.cashMovement.create({
    data: {
      direction: parsed.data.direction,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      note: parsed.data.note || null,
      createdById: user.id
    }
  });

  revalidatePath("/caisse");

  await createLog({
    category: "CASH",
    action: `CASH_${movement.direction}`,
    details: `${movement.amount} XAF - ${movement.reason}${movement.note ? ` (${movement.note})` : ""}`,
    userId: user.id
  });

  return NextResponse.json(movement);
}
