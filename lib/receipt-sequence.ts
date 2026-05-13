import { prisma } from "@/lib/prisma";

/**
 * Génère un numéro de reçu séquentiel unique au format REC-AAAA-MM-NNNN
 * Utilise une transaction Prisma pour garantir l'atomicité
 */
export async function getNextReceiptNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.receiptSequence.findUnique({
      where: { year_month: { year, month } }
    });

    if (existing) {
      return tx.receiptSequence.update({
        where: { year_month: { year, month } },
        data: { lastSeq: { increment: 1 } }
      });
    } else {
      return tx.receiptSequence.create({
        data: { year, month, lastSeq: 1 }
      });
    }
  });

  const paddedSeq = String(seq.lastSeq).padStart(4, "0");
  const paddedMonth = String(month).padStart(2, "0");
  return `REC-${year}-${paddedMonth}-${paddedSeq}`;
}
