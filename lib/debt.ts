import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function getClientDebt(clientId: string, currencyCode: string) {
  return await prisma.clientDebt.findUnique({
    where: {
      clientId_currencyCode: {
        clientId,
        currencyCode,
      },
    },
  });
}

export async function updateClientDebt(
  clientId: string,
  currencyCode: string,
  amountChange: number,
  note?: string
) {
  return await prisma.clientDebt.upsert({
    where: {
      clientId_currencyCode: {
        clientId,
        currencyCode,
      },
    },
    update: {
      amount: { increment: amountChange },
      note: note || "Mise à jour automatique",
    },
    create: {
      clientId,
      currencyCode,
      amount: new Decimal(amountChange),
      note,
    },
  });
}
