import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getStockBalances() {
  const [moves, debts] = await Promise.all([
    prisma.stockMovement.findMany({
      include: { currency: true, supplier: true }
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
      bySupplier: Map<string, { id: string; name: string; balance: Prisma.Decimal; debt: Prisma.Decimal }>
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
        bySupplier: new Map()
      };

    if (move.direction === "IN") {
      current.inTotal = current.inTotal.add(move.amount);
    } else {
      current.outTotal = current.outTotal.add(move.amount);
    }

    if (move.supplierId) {
      const supplierData = current.bySupplier.get(move.supplierId) ?? {
        id: move.supplierId,
        name: move.supplier?.name ?? "Inconnu",
        balance: new Prisma.Decimal(0),
        debt: new Prisma.Decimal(0)
      };

      if (move.direction === "IN") {
        supplierData.balance = supplierData.balance.add(move.amount);
      } else {
        supplierData.balance = supplierData.balance.sub(move.amount);
      }
      current.bySupplier.set(move.supplierId, supplierData);
    }

    byCurrency.set(move.currencyCode, current);
  }

  // Injecter les dettes
  for (const debt of debts) {
    const curr = byCurrency.get(debt.currencyCode);
    if (curr) {
      const sData = curr.bySupplier.get(debt.supplierId) ?? {
        id: debt.supplierId,
        name: debt.supplier.name,
        balance: new Prisma.Decimal(0),
        debt: new Prisma.Decimal(0)
      };
      sData.debt = debt.amount;
      curr.bySupplier.set(debt.supplierId, sData);
    }
  }

  return [...byCurrency.values()]
    .map((row) => ({
      code: row.code,
      name: row.name,
      inTotal: row.inTotal,
      outTotal: row.outTotal,
      balance: row.inTotal.sub(row.outTotal),
      suppliers: [...row.bySupplier.values()].map(s => ({
        ...s,
        balance: s.balance,
        debt: s.debt
      }))
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

