import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";

export async function getSupplierHistory() {
  const movements = await prisma.stockMovement.findMany({
    where: {
      supplierId: { not: null }
    },
    include: {
      supplier: { select: { name: true } },
      createdBy: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return movements.map(m => ({
    id: m.id,
    supplierName: m.supplier?.name ?? "Inconnu",
    currencyCode: m.currencyCode,
    amount: toNumber(m.amount),
    direction: m.direction,
    note: m.note,
    createdBy: m.createdBy.name,
    createdAt: m.createdAt
  }));
}
