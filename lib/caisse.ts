import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { startOfDay, subDays, format, isSameDay } from "date-fns";

export async function getCaisseData() {
  const today = new Date();
  const weekStart = startOfDay(subDays(today, 6));

  const [txByMethod, cashByMethod, recentTx, movements] = await Promise.all([
    // Agrégation des transactions par type et méthode
    prisma.transaction.groupBy({
      by: ["type", "paymentMethod"],
      _sum: { amountGiven: true, amountReceived: true }
    }),
    // Agrégation des mouvements manuels par direction et méthode
    prisma.cashMovement.groupBy({
      by: ["direction", "method"],
      _sum: { amount: true }
    }),
    // Transactions récentes pour le graphique
    prisma.transaction.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { type: true, amountGiven: true, amountReceived: true, createdAt: true, paymentMethod: true }
    }),
    // Liste d'affichage
    prisma.cashMovement.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const calculateBalanceForMethods = (methods: string[]) => {
    const txIn = txByMethod
      .filter((row) => row.type === "SELL" && methods.includes(row.paymentMethod))
      .reduce((sum, row) => sum + toNumber(row._sum.amountGiven ?? 0), 0);

    const txOut = txByMethod
      .filter((row) => row.type === "BUY" && methods.includes(row.paymentMethod))
      .reduce((sum, row) => sum + toNumber(row._sum.amountReceived ?? 0), 0);

    const manualIn = cashByMethod
      .filter((row) => row.direction === "IN" && methods.includes(row.method))
      .reduce((sum, row) => sum + toNumber(row._sum.amount ?? 0), 0);

    const manualOut = cashByMethod
      .filter((row) => row.direction === "OUT" && methods.includes(row.method))
      .reduce((sum, row) => sum + toNumber(row._sum.amount ?? 0), 0);

    return txIn - txOut + manualIn - manualOut;
  };

  const cashBalance = calculateBalanceForMethods(["CASH"]);
  const liquidBalance = calculateBalanceForMethods(["MOBILE_MONEY"]);
  const bankBalance = calculateBalanceForMethods(["BANK_TRANSFER", "BANK_DEPOSIT"]);

  const balance = cashBalance + liquidBalance + bankBalance;

  // Calculer les totaux globaux pour l'UI existante (rétrocompatibilité)
  const xafIn = txByMethod
    .filter((row) => row.type === "SELL")
    .reduce((sum, row) => sum + toNumber(row._sum.amountGiven ?? 0), 0);
  const xafOut = txByMethod
    .filter((row) => row.type === "BUY")
    .reduce((sum, row) => sum + toNumber(row._sum.amountReceived ?? 0), 0);
  const manualIn = cashByMethod
    .filter((row) => row.direction === "IN")
    .reduce((sum, row) => sum + toNumber(row._sum.amount ?? 0), 0);
  const manualOut = cashByMethod
    .filter((row) => row.direction === "OUT")
    .reduce((sum, row) => sum + toNumber(row._sum.amount ?? 0), 0);

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
    cashBalance,
    liquidBalance,
    bankBalance,
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
      method: m.method,
      reason: m.reason,
      note: m.note,
      createdBy: m.createdBy.name,
      createdAt: m.createdAt
    }))
  };
}
