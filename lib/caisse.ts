import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { startOfDay, endOfDay, subDays, format, isSameDay } from "date-fns";

export async function getCaisseData() {
  const today = new Date();

  const [transactions, movements] = await Promise.all([
    prisma.transaction.findMany({
      select: { type: true, amountGiven: true, amountReceived: true, createdAt: true }
    }),
    prisma.cashMovement.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  // Flux XAF auto depuis les transactions
  const xafIn = transactions
    .filter((t) => t.type === "SELL")
    .reduce((sum, t) => sum + toNumber(t.amountGiven), 0);

  const xafOut = transactions
    .filter((t) => t.type === "BUY")
    .reduce((sum, t) => sum + toNumber(t.amountReceived), 0);

  // Ajustements manuels
  const manualIn = movements
    .filter((m) => m.direction === "IN")
    .reduce((sum, m) => sum + toNumber(m.amount), 0);

  const manualOut = movements
    .filter((m) => m.direction === "OUT")
    .reduce((sum, m) => sum + toNumber(m.amount), 0);

  const balance = xafIn - xafOut + manualIn - manualOut;

  // Flux XAF des 7 derniers jours pour le graphique
  const weeklyFlow = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayTx = transactions.filter((t) => isSameDay(t.createdAt, date));
    const dayIn = dayTx
      .filter((t) => t.type === "SELL")
      .reduce((sum, t) => sum + toNumber(t.amountGiven), 0);
    const dayOut = dayTx
      .filter((t) => t.type === "BUY")
      .reduce((sum, t) => sum + toNumber(t.amountReceived), 0);
    return {
      day: format(date, "EEE"),
      in: dayIn,
      out: dayOut,
      net: dayIn - dayOut
    };
  });

  // Flux du jour
  const todayTx = transactions.filter((t) => isSameDay(t.createdAt, today));
  const todayIn = todayTx
    .filter((t) => t.type === "SELL")
    .reduce((sum, t) => sum + toNumber(t.amountGiven), 0);
  const todayOut = todayTx
    .filter((t) => t.type === "BUY")
    .reduce((sum, t) => sum + toNumber(t.amountReceived), 0);

  return {
    balance,
    xafIn,
    xafOut,
    manualIn,
    manualOut,
    todayIn,
    todayOut,
    weeklyFlow,
    movements: movements.map((m) => ({
      id: m.id,
      direction: m.direction,
      amount: toNumber(m.amount),
      reason: m.reason,
      note: m.note,
      createdBy: m.createdBy.name,
      createdAt: m.createdAt
    }))
  };
}
