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
      include: { currency: true, supplier: true },
      orderBy: { createdAt: "desc" }
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

    if (move.reason === "SUPPLIER_PURCHASE" && move.direction === "IN" && move.unitPrice) {
      current.pricedAmount = current.pricedAmount.add(move.amount);
      current.pricedCost = current.pricedCost.add(move.totalCostXaf ?? move.unitPrice.mul(move.amount));
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

      if (move.reason === "SUPPLIER_PURCHASE" && move.direction === "IN" && move.unitPrice) {
        supplierData.pricedAmount = supplierData.pricedAmount.add(move.amount);
        supplierData.pricedCost = supplierData.pricedCost.add(move.totalCostXaf ?? move.unitPrice.mul(move.amount));
        if (!supplierData.lastBuyRate) {
          supplierData.lastBuyRate = move.unitPrice;
        }
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
    sData.debt = debt.amount;
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
