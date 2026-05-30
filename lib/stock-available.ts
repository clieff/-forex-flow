import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Renvoie le solde de stock disponible (IN − OUT) pour une devise, agrégé en SQL.
 * Si `supplierId` est fourni, restreint au stock attribué à ce fournisseur ;
 * sinon, renvoie le solde global de la devise (tous mouvements confondus).
 *
 * Doit être appelé à l'intérieur d'une transaction Prisma (isolation Serializable)
 * pour éviter qu'une vente concurrente ne crée un solde négatif.
 */
export async function getAvailableStock(
  currencyCode: string,
  supplierId: string | null | undefined,
  client: DbClient = prisma
): Promise<Prisma.Decimal> {
  const rows = await client.stockMovement.groupBy({
    by: ["direction"],
    where: {
      currencyCode,
      ...(supplierId ? { supplierId } : {})
    },
    _sum: { amount: true }
  });

  const inSum = rows.find((row) => row.direction === "IN")?._sum.amount ?? new Prisma.Decimal(0);
  const outSum = rows.find((row) => row.direction === "OUT")?._sum.amount ?? new Prisma.Decimal(0);

  return new Prisma.Decimal(inSum).minus(new Prisma.Decimal(outSum));
}
