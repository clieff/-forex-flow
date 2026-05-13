import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const [transactions, cashMovements] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
      },
      include: {
        currency: true,
        createdBy: { select: { name: true } },
        client: { select: { name: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.cashMovement.findMany({
      where: {
        createdAt: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
      },
      include: { createdBy: { select: { name: true } } }
    })
  ]);

  // Regroupement par devise
  const byCurrency = new Map<string, {
    code: string;
    name: string;
    buyCount: number;
    sellCount: number;
    buyVolumeFx: number;
    sellVolumeFx: number;
    xafIn: number;
    xafOut: number;
    margin: number;
  }>();

  for (const tx of transactions) {
    const curr = byCurrency.get(tx.currencyCode) ?? {
      code: tx.currencyCode,
      name: tx.currency.name,
      buyCount: 0, sellCount: 0,
      buyVolumeFx: 0, sellVolumeFx: 0,
      xafIn: 0, xafOut: 0,
      margin: 0
    };

    const midRate = (toNumber(tx.currency.buyRate) + toNumber(tx.currency.sellRate)) / 2;

    if (tx.type === "BUY") {
      curr.buyCount++;
      curr.buyVolumeFx += toNumber(tx.amountGiven);
      curr.xafOut += toNumber(tx.amountReceived);
      curr.margin += (midRate - toNumber(tx.rateUsed)) * toNumber(tx.amountGiven);
    } else {
      curr.sellCount++;
      curr.sellVolumeFx += toNumber(tx.amountReceived);
      curr.xafIn += toNumber(tx.amountGiven);
      curr.margin += (toNumber(tx.rateUsed) - midRate) * toNumber(tx.amountReceived);
    }

    byCurrency.set(tx.currencyCode, curr);
  }

  // Totaux XAF
  const totalXafIn = transactions.filter(t => t.type === "SELL").reduce((s, t) => s + toNumber(t.amountGiven), 0);
  const totalXafOut = transactions.filter(t => t.type === "BUY").reduce((s, t) => s + toNumber(t.amountReceived), 0);
  const totalMargin = transactions.reduce((s, t) => {
    const midRate = (toNumber(t.currency.buyRate) + toNumber(t.currency.sellRate)) / 2;
    return s + (t.type === "BUY"
      ? (midRate - toNumber(t.rateUsed)) * toNumber(t.amountGiven)
      : (toNumber(t.rateUsed) - midRate) * toNumber(t.amountReceived));
  }, 0);

  // Mouvements manuels de caisse du jour
  const manualIn = cashMovements.filter(m => m.direction === "IN").reduce((s, m) => s + toNumber(m.amount), 0);
  const manualOut = cashMovements.filter(m => m.direction === "OUT").reduce((s, m) => s + toNumber(m.amount), 0);

  return NextResponse.json({
    date: targetDate.toISOString(),
    summary: {
      totalTransactions: transactions.length,
      buyCount: transactions.filter(t => t.type === "BUY").length,
      sellCount: transactions.filter(t => t.type === "SELL").length,
      totalXafIn,
      totalXafOut,
      netXaf: totalXafIn - totalXafOut,
      totalMargin,
      manualIn,
      manualOut,
      caisseNet: totalXafIn - totalXafOut + manualIn - manualOut
    },
    byCurrency: [...byCurrency.values()],
    transactions: transactions.map(tx => ({
      id: tx.id,
      receiptNumber: tx.receiptNumber,
      type: tx.type,
      currencyCode: tx.currencyCode,
      amountGiven: toNumber(tx.amountGiven),
      amountReceived: toNumber(tx.amountReceived),
      rateUsed: toNumber(tx.rateUsed),
      clientName: tx.client?.name ?? tx.clientName ?? "Walk-in",
      agentName: tx.createdBy.name,
      createdAt: tx.createdAt
    })),
    cashMovements: cashMovements.map(m => ({
      direction: m.direction,
      amount: toNumber(m.amount),
      reason: m.reason,
      note: m.note,
      createdBy: m.createdBy.name,
      createdAt: m.createdAt
    }))
  });
}
