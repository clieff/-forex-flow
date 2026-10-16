import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SupplierRow = {
  id: string;
  name: string;
  balance: Prisma.Decimal;
  debt: Prisma.Decimal;
  pricedAmount: Prisma.Decimal;
  pricedCost: Prisma.Decimal;
  averageBuyRate: Prisma.Decimal | null;
  lastBuyRate: Prisma.Decimal | null;
};

export async function getStockBalances() {
  const [moves, debts] = await Promise.all([
    prisma.stockMovement.findMany({
      include: { currency: true, supplier: true, transaction: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.supplierDebt.findMany({
      include: { currency: true, supplier: true }
    })
  ]);

  const byCurrency = new Map<
    string,
    {
      code: string;
      name: string;
      inTotal: Prisma.Decimal;
      outTotal: Prisma.Decimal;
      pricedAmount: Prisma.Decimal;
      pricedCost: Prisma.Decimal;
      weightedBuyRate: Prisma.Decimal | null;
      bySupplier: Map<string, SupplierRow>;
    }
  >();

  for (const move of moves) {
    const current =
      byCurrency.get(move.currencyCode) ??
      {
        code: move.currencyCode,
        name: move.currency.name,
        inTotal: new Prisma.Decimal(0),
        outTotal: new Prisma.Decimal(0),
        pricedAmount: new Prisma.Decimal(0),
        pricedCost: new Prisma.Decimal(0),
        weightedBuyRate: null,
        bySupplier: new Map()
      };

    if (move.direction === "IN") {
      current.inTotal = current.inTotal.add(move.amount);
    } else {
      current.outTotal = current.outTotal.add(move.amount);
    }

    if (move.direction === "IN") {
      const cost = move.totalCostXaf ?? (move.transaction?.type === "BUY"
        ? move.transaction.amountReceived
        : move.unitPrice ? move.unitPrice.mul(move.amount) : null);
      if (cost) {
        current.pricedAmount = current.pricedAmount.add(move.amount);
        current.pricedCost = current.pricedCost.add(cost);
      }
    } else if (current.pricedAmount.gt(0)) {
      const unitCost = current.pricedCost.div(current.pricedAmount);
      const outgoingCost = move.totalCostXaf ?? unitCost.mul(move.amount);
      current.pricedAmount = current.pricedAmount.sub(move.amount);
      current.pricedCost = current.pricedCost.sub(outgoingCost);
    }

    if (move.supplierId) {
      const supplierData = current.bySupplier.get(move.supplierId) ?? {
        id: move.supplierId,
        name: move.supplier?.name ?? "Inconnu",
        balance: new Prisma.Decimal(0),
        debt: new Prisma.Decimal(0),
        pricedAmount: new Prisma.Decimal(0),
        pricedCost: new Prisma.Decimal(0),
        averageBuyRate: null,
        lastBuyRate: null
      };

      if (move.direction === "IN") {
        supplierData.balance = supplierData.balance.add(move.amount);
      } else {
        supplierData.balance = supplierData.balance.sub(move.amount);
      }

      if (move.direction === "IN") {
        const cost = move.totalCostXaf ?? (move.transaction?.type === "BUY"
          ? move.transaction.amountReceived
          : move.unitPrice ? move.unitPrice.mul(move.amount) : null);
        if (cost) {
          supplierData.pricedAmount = supplierData.pricedAmount.add(move.amount);
          supplierData.pricedCost = supplierData.pricedCost.add(cost);
        }
        if (move.unitPrice) {
          supplierData.lastBuyRate = move.unitPrice;
        }
      } else if (supplierData.pricedAmount.gt(0)) {
        const unitCost = supplierData.pricedCost.div(supplierData.pricedAmount);
        const outgoingCost = move.totalCostXaf ?? unitCost.mul(move.amount);
        supplierData.pricedAmount = supplierData.pricedAmount.sub(move.amount);
        supplierData.pricedCost = supplierData.pricedCost.sub(outgoingCost);
      }

      current.bySupplier.set(move.supplierId, supplierData);
    }

    byCurrency.set(move.currencyCode, current);
  }

  for (const debt of debts) {
    const curr = byCurrency.get(debt.currencyCode);
    if (!curr) {
      continue;
    }

    const sData = curr.bySupplier.get(debt.supplierId) ?? {
      id: debt.supplierId,
      name: debt.supplier.name,
      balance: new Prisma.Decimal(0),
      debt: new Prisma.Decimal(0),
      pricedAmount: new Prisma.Decimal(0),
      pricedCost: new Prisma.Decimal(0),
      averageBuyRate: null,
      lastBuyRate: null
    };
    sData.debt = debt.amountXaf;
    curr.bySupplier.set(debt.supplierId, sData);
  }

  return [...byCurrency.values()]
    .map((row) => {
      row.weightedBuyRate = row.pricedAmount.gt(0) ? row.pricedCost.div(row.pricedAmount).toDecimalPlaces(4) : null;

      return {
        code: row.code,
        name: row.name,
        inTotal: row.inTotal,
        outTotal: row.outTotal,
        balance: row.inTotal.sub(row.outTotal),
        weightedBuyRate: row.weightedBuyRate,
        suppliers: [...row.bySupplier.values()]
          .map((s) => ({
            ...s,
            averageBuyRate: s.pricedAmount.gt(0) ? s.pricedCost.div(s.pricedAmount).toDecimalPlaces(4) : null
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}
