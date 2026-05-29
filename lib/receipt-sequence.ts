import { prisma } from "@/lib/prisma";
import { getZonedDateParts } from "@/lib/timezone";

/**
 * Génère un numéro de reçu séquentiel unique au format REC-AAAA-MM-NNNN.
 * Le mois/année sont calculés sur le fuseau Africa/Douala et l'incrément
 * est atomique (upsert) pour résister aux requêtes concurrentes.
 */
export async function getNextReceiptNumber(): Promise<string> {
  const { year, month } = getZonedDateParts();

  const seq = await prisma.receiptSequence.upsert({
    where: { year_month: { year, month } },
    update: { lastSeq: { increment: 1 } },
    create: { year, month, lastSeq: 1 }
  });

  const paddedSeq = String(seq.lastSeq).padStart(4, "0");
  const paddedMonth = String(month).padStart(2, "0");
  return `REC-${year}-${paddedMonth}-${paddedSeq}`;
}
