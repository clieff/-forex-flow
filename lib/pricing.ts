import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function calculateAverageBuyRate(currencyCode: string) {
  const purchases = await prisma.stockMovement.findMany({
    where: {
      currencyCode,
      direction: "IN",
      reason: "SUPPLIER_PURCHASE",
      supplierId: { not: null },
      unitPrice: { not: null }
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      amount: true,
      unitPrice: true,
      totalCostXaf: true
    }
  });

  if (purchases.length === 0) {
    return null;
  }

  let totalCost = new Decimal(0);
  let totalAmount = new Decimal(0);

  for (const move of purchases) {
    if (!move.unitPrice) {
      continue;
    }

    totalCost = totalCost.plus(move.totalCostXaf ?? move.unitPrice.times(move.amount));
    totalAmount = totalAmount.plus(move.amount);
  }

  return totalAmount.isZero() ? null : totalCost.dividedBy(totalAmount).toDecimalPlaces(4);
}

export async function updateCurrencyBuyRate(currencyCode: string) {
  const newRate = await calculateAverageBuyRate(currencyCode);

  if (newRate) {
    await prisma.currency.update({
      where: { code: currencyCode },
      data: { buyRate: newRate }
    });
  }
}
