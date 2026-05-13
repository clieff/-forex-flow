import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createLog } from "@/lib/logs";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rl = checkRateLimit({ key: `stock:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currencyCode?: string;
    direction?: "IN" | "OUT";
    amount?: number;
    totalAmount?: number;
    supplierId?: string | null;
    note?: string;
    reason?: "SUPPLIER_PURCHASE" | "ADJUSTMENT";
    isDebt?: boolean;
  };

  const currencyCode = (body.currencyCode ?? "").trim().toUpperCase();
  if (currencyCode.length !== 3) {
    return NextResponse.json({ error: "Invalid currencyCode" }, { status: 400 });
  }

  if (body.direction !== "IN" && body.direction !== "OUT") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }
  const direction = body.direction;

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const amountNum = body.amount;

  const reason = body.reason ?? "ADJUSTMENT";
  if (reason !== "SUPPLIER_PURCHASE" && reason !== "ADJUSTMENT") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const currency = await prisma.currency.findUnique({ where: { code: currencyCode } });
  if (!currency) {
    return NextResponse.json({ error: "Currency not found" }, { status: 404 });
  }

  const supplierId = body.supplierId ? body.supplierId : null;
  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
  }

  const move = await prisma.$transaction(async (tx) => {
    const stockMove = await tx.stockMovement.create({
      data: {
        currencyCode,
        direction,
        amount: new Prisma.Decimal(amountNum).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        reason: body.isDebt ? "DEBT_SETTLEMENT" : reason,
        note: body.note?.trim() || null,
        supplierId,
        createdById: session.user.id
      }
    });

    if (supplierId) {
      const actualAmount = new Prisma.Decimal(amountNum);
      const totalExpected = body.totalAmount ? new Prisma.Decimal(body.totalAmount) : actualAmount;
      const unreceived = totalExpected.minus(actualAmount);

      // Calcul du changement de dette
      let debtChange = new Prisma.Decimal(0);
      
      if (body.isDebt) {
        // Cas 1: C'est un règlement de dette direct
        debtChange = direction === "IN" ? actualAmount.neg() : actualAmount;
      } else if (unreceived.gt(0)) {
        // Cas 2: Achat avec reliquat (le fournisseur nous doit le reste)
        // Si IN: On a reçu moins que prévu, le fournisseur nous doit la différence
        debtChange = direction === "IN" ? unreceived.neg() : unreceived;
      }

      if (!debtChange.isZero()) {
        await tx.supplierDebt.upsert({
          where: {
            supplierId_currencyCode: {
              supplierId,
              currencyCode
            }
          },
          update: {
            amount: { increment: debtChange }
          },
          create: {
            supplierId,
            currencyCode,
            amount: debtChange
          }
        });
      }
    }

    return stockMove;
  });

  await createLog({
    category: "STOCK",
    action: body.isDebt ? "DEBT_LOG" : `STOCK_${move.direction}`,
    details: `${move.amount} ${move.currencyCode} - ${body.isDebt ? "CRÉANCE" : move.reason}${move.note ? ` (${move.note})` : ""}`,
    userId: session.user.id
  });

  return NextResponse.json({ moveId: move.id });
}
