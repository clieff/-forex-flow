import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createLog } from "@/lib/logs";
import { updateCurrencyBuyRate } from "@/lib/pricing";

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const rl = await checkRateLimit({ key: `stock:${ip}`, limit: 30, windowMs: 60_000 });
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
    unitPrice?: number | null;
    totalCostXaf?: number | null;
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
  const amountNum = Number(body.amount);

  const reason = body.reason ?? "ADJUSTMENT";
  if (reason !== "SUPPLIER_PURCHASE" && reason !== "ADJUSTMENT") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const supplierId = body.supplierId ? body.supplierId : null;
  if (reason === "SUPPLIER_PURCHASE" && !supplierId) {
    return NextResponse.json({ error: "Supplier is required for supplier purchases" }, { status: 400 });
  }
  if (reason === "SUPPLIER_PURCHASE" && direction !== "IN") {
    return NextResponse.json({ error: "Supplier purchases must be stock entries" }, { status: 400 });
  }

  const currency = await prisma.currency.findUnique({ where: { code: currencyCode } });
  if (!currency) {
    return NextResponse.json({ error: "Currency not found" }, { status: 404 });
  }

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }
  }

  const actualAmount = new Prisma.Decimal(amountNum).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const totalExpected = body.totalAmount ? new Prisma.Decimal(body.totalAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP) : actualAmount;
  const unreceived = totalExpected.minus(actualAmount);

  let unitPrice: Prisma.Decimal | null = null;
  let totalCostXaf: Prisma.Decimal | null = null;

  if (reason === "SUPPLIER_PURCHASE" && direction === "IN") {
    const rawUnitPrice = body.unitPrice ? Number(body.unitPrice) : null;
    const rawTotalCost = body.totalCostXaf ? Number(body.totalCostXaf) : null;

    if (rawUnitPrice !== null && rawUnitPrice > 0) {
      unitPrice = new Prisma.Decimal(rawUnitPrice).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    }
    if (rawTotalCost !== null && rawTotalCost > 0) {
      totalCostXaf = new Prisma.Decimal(rawTotalCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }

    if (!unitPrice && totalCostXaf) {
      unitPrice = totalCostXaf.div(actualAmount).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    }
    if (!totalCostXaf && unitPrice) {
      totalCostXaf = unitPrice.mul(actualAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }

    if (!unitPrice || !totalCostXaf) {
      return NextResponse.json({ error: "Purchase price data is required for supplier purchases" }, { status: 400 });
    }
  }

  const move = await prisma.$transaction(async (tx) => {
    const stockMove = await tx.stockMovement.create({
      data: {
        currencyCode,
        direction,
        amount: actualAmount,
        unitPrice,
        totalCostXaf,
        reason: body.isDebt ? "DEBT_SETTLEMENT" : reason,
        note: body.note?.trim() || null,
        supplierId,
        createdById: session.user.id
      }
    });

    if (supplierId) {
      let debtChange = new Prisma.Decimal(0);

      if (body.isDebt) {
        debtChange = direction === "IN" ? actualAmount : actualAmount.neg();
      } else if (unreceived.gt(0)) {
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

  if (reason === "SUPPLIER_PURCHASE" && direction === "IN") {
    await updateCurrencyBuyRate(currencyCode);
  }

  await createLog({
    category: "STOCK",
    action: body.isDebt ? "SUPPLIER_DEBT_SETTLEMENT" : `STOCK_${move.direction}`,
    details:
      `${move.amount} ${move.currencyCode} - ${move.reason}` +
      (move.unitPrice ? ` @ ${move.unitPrice} XAF` : "") +
      (move.note ? ` (${move.note})` : ""),
    userId: session.user.id
  });

  return NextResponse.json({ moveId: move.id });
}
