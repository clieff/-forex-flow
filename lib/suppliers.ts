import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";

type SupplierCurrencyAccumulator = {
  currencyCode: string;
  stockBalance: number;
  debtBalance: number;
  totalPurchased: number;
  totalSold: number;
  totalCostXaf: number;
  pricedAmount: number;
  lastBuyRate: number | null;
};

export async function getSuppliersOverview() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      debts: {
        orderBy: [{ amount: "desc" }, { currencyCode: "asc" }]
      },
      moves: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true }
          },
          transaction: {
            select: {
              id: true,
              receiptNumber: true,
              clientName: true,
              client: {
                select: { id: true, name: true }
              }
            }
          }
        }
      }
    }
  });

  return suppliers.map((supplier) => {
    const byCurrency = new Map<string, SupplierCurrencyAccumulator>();

    for (const move of supplier.moves) {
      const current =
        byCurrency.get(move.currencyCode) ??
        {
          currencyCode: move.currencyCode,
          stockBalance: 0,
          debtBalance: 0,
          totalPurchased: 0,
          totalSold: 0,
          totalCostXaf: 0,
          pricedAmount: 0,
          lastBuyRate: null
        };

      const amount = toNumber(move.amount);
      current.stockBalance += move.direction === "IN" ? amount : -amount;

      if (move.direction === "IN") {
        current.totalPurchased += amount;
      } else {
        current.totalSold += amount;
      }

      if (move.reason === "SUPPLIER_PURCHASE" && move.direction === "IN" && move.unitPrice) {
        const unitPrice = toNumber(move.unitPrice);
        current.totalCostXaf += toNumber(move.totalCostXaf ?? move.amount.mul(move.unitPrice));
        current.pricedAmount += amount;
        if (current.lastBuyRate === null) {
          current.lastBuyRate = unitPrice;
        }
      }

      byCurrency.set(move.currencyCode, current);
    }

    for (const debt of supplier.debts) {
      const current =
        byCurrency.get(debt.currencyCode) ??
        {
          currencyCode: debt.currencyCode,
          stockBalance: 0,
          debtBalance: 0,
          totalPurchased: 0,
          totalSold: 0,
          totalCostXaf: 0,
          pricedAmount: 0,
          lastBuyRate: null
        };

      current.debtBalance = toNumber(debt.amount);
      byCurrency.set(debt.currencyCode, current);
    }

    const positions = [...byCurrency.values()]
      .map((entry) => ({
        currencyCode: entry.currencyCode,
        stockBalance: entry.stockBalance,
        debtBalance: entry.debtBalance,
        totalPurchased: entry.totalPurchased,
        totalSold: entry.totalSold,
        averageBuyRate: entry.pricedAmount > 0 ? entry.totalCostXaf / entry.pricedAmount : null,
        lastBuyRate: entry.lastBuyRate
      }))
      .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));

    return {
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact,
      createdAt: supplier.createdAt,
      debts: supplier.debts.map((debt) => ({
        id: debt.id,
        currencyCode: debt.currencyCode,
        amount: toNumber(debt.amount),
        note: debt.note,
        updatedAt: debt.updatedAt
      })),
      positions,
      recentMovements: supplier.moves.slice(0, 12).map((move) => ({
        id: move.id,
        currencyCode: move.currencyCode,
        direction: move.direction,
        reason: move.reason,
        amount: toNumber(move.amount),
        note: move.note,
        unitPrice: move.unitPrice ? toNumber(move.unitPrice) : null,
        totalCostXaf: move.totalCostXaf ? toNumber(move.totalCostXaf) : null,
        createdAt: move.createdAt,
        createdBy: move.createdBy.name,
        transactionId: move.transactionId,
        receiptNumber: move.transaction?.receiptNumber ?? null,
        clientName: move.transaction?.client?.name ?? move.transaction?.clientName ?? null
      })),
      summary: {
        totalMovements: supplier.moves.length,
        totalDebtCurrencies: supplier.debts.filter((debt) => !debt.amount.isZero()).length,
        outstandingDebt: supplier.debts.reduce((sum, debt) => sum + toNumber(debt.amount), 0),
        lastMovementAt: supplier.moves[0]?.createdAt ?? null
      }
    };
  });
}

export async function getSupplierHistory() {
  const suppliers = await getSuppliersOverview();

  return suppliers
    .flatMap((supplier) =>
      supplier.recentMovements.map((movement) => ({
        ...movement,
        supplierId: supplier.id,
        supplierName: supplier.name
      }))
    )
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 50);
}
