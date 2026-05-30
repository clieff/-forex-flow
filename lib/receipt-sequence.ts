import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getZonedDateParts } from "@/lib/timezone";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Génère un numéro de reçu séquentiel unique au format REC-AAAA-MM-NNNN.
 * Le mois/année sont calculés sur le fuseau Africa/Douala et l'incrément
 * est atomique (upsert) pour résister aux requêtes concurrentes.
 *
 * Peut être appelé à l'intérieur d'une transaction externe en passant le
 * `client` Prisma : utile pour éviter d'incrémenter la séquence si la
 * transaction englobante échoue (pas de trou dans la numérotation).
 */
export async function getNextReceiptNumber(client: DbClient = prisma): Promise<string> {
  const { year, month } = getZonedDateParts();

  const seq = await client.receiptSequence.upsert({
    where: { year_month: { year, month } },
    update: { lastSeq: { increment: 1 } },
    create: { year, month, lastSeq: 1 }
  });

  const paddedSeq = String(seq.lastSeq).padStart(4, "0");
  const paddedMonth = String(month).padStart(2, "0");
  return `REC-${year}-${paddedMonth}-${paddedSeq}`;
}
