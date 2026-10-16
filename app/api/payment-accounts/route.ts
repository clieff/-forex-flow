import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

const createPaymentAccountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  kind: z.enum(["CASH", "MOBILE_MONEY", "BANK", "OTHER"])
});

export async function GET() {
  const { user } = await getServerSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.paymentAccount.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { name: "asc" }]
  });
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createPaymentAccountSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const account = await prisma.paymentAccount.create({ data: parsed.data });
    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ce moyen de paiement existe déjà." }, { status: 409 });
  }
}
