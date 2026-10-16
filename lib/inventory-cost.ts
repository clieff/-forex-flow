import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

function asDecimal(value: Prisma.Decimal | number | null | undefined) {
  return value == null ? new Prisma.Decimal(0) : new Prisma.Decimal(value);
}

export async function getInventoryUnitCost({
  currencyCode,
  supplierId,
  fallbackUnitCost,
  client = prisma
}: {
  currencyCode: string;
  supplierId?: string | null;
  fallbackUnitCost: Prisma.Decimal;
  client?: DbClient;
}) {
  const movements = await client.stockMovement.findMany({
    where: { currencyCode, ...(supplierId ? { supplierId } : {}) },
    include: {
      transaction: {
        select: { type: true, amountReceived: true }
      }
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  });

  let quantity = new Prisma.Decimal(0);
  let cost = new Prisma.Decimal(0);

  for (const movement of movements) {
    const amount = asDecimal(movement.amount);
    if (movement.direction === "IN") {
      const incomingCost = movement.totalCostXaf
        ? asDecimal(movement.totalCostXaf)
        : movement.transaction?.type === "BUY"
          ? asDecimal(movement.transaction.amountReceived)
          : movement.unitPrice
            ? asDecimal(movement.unitPrice).mul(amount)
            : fallbackUnitCost.mul(amount);
      quantity = quantity.add(amount);
      cost = cost.add(incomingCost);
      continue;
    }

    const unitCost = quantity.gt(0) ? cost.div(quantity) : fallbackUnitCost;
    const outgoingCost = movement.totalCostXaf
      ? asDecimal(movement.totalCostXaf)
      : unitCost.mul(amount);
    quantity = quantity.sub(amount);
    cost = cost.sub(outgoingCost);
  }

  if (quantity.lte(0)) return fallbackUnitCost;
  return cost.div(quantity).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}
