import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { startOfDay, subDays, format, isSameDay } from "date-fns";

export async function getCaisseData() {
  const today = new Date();
  const weekStart = startOfDay(subDays(today, 6));

  const [txByType, cashByDirection, recentTx, movements] = await Promise.all([
    // Totaux XAF agrégés sur TOUTES les transactions
    prisma.transaction.groupBy({
      by: ["type"],
      _sum: { amountGiven: true, amountReceived: true }
    }),
    // Totaux des mouvements manuels agrégés sur TOUS les mouvements
    prisma.cashMovement.groupBy({
      by: ["direction"],
      _sum: { amount: true }
    }),
    // Transactions des 7 derniers jours uniquement (graphique + jour)
    prisma.transaction.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { type: true, amountGiven: true, amountReceived: true, createdAt: true }
    }),
    // Liste d'affichage (50 derniers mouvements)
    prisma.cashMovement.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  // Flux XAF auto depuis les transactions (SELL = entrée XAF, BUY = sortie XAF)
  const sellAgg = txByType.find((row) => row.type === "SELL");
  const buyAgg = txByType.find((row) => row.type === "BUY");
  const xafIn = toNumber(sellAgg?._sum.amountGiven ?? 0);
  const xafOut = toNumber(buyAgg?._sum.amountReceived ?? 0);

  // Ajustements manuels (sur l'intégralité des mouvements)
  const inAgg = cashByDirection.find((row) => row.direction === "IN");
  const outAgg = cashByDirection.find((row) => row.direction === "OUT");
  const manualIn = toNumber(inAgg?._sum.amount ?? 0);
  const manualOut = toNumber(outAgg?._sum.amount ?? 0);

  const balance = xafIn - xafOut + manualIn - manualOut;

  // Flux XAF des 7 derniers jours pour le graphique
  const weeklyFlow = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayTx = recentTx.filter((t) => isSameDay(t.createdAt, date));
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
  const todayTx = recentTx.filter((t) => isSameDay(t.createdAt, today));
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
