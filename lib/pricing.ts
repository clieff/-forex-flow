import { prisma } from "@/lib/prisma";
import { getInventoryUnitCost } from "@/lib/inventory-cost";

export async function calculateAverageBuyRate(currencyCode: string) {
  const currency = await prisma.currency.findUnique({ where: { code: currencyCode } });
  if (!currency) return null;

  return getInventoryUnitCost({
    currencyCode,
    fallbackUnitCost: currency.buyRate
  });
}
