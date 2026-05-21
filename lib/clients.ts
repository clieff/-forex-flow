import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";

export async function getClientsOverview() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      fixedRates: {
        orderBy: { currencyCode: "asc" }
      },
      debts: {
        orderBy: [{ amount: "desc" }, { currencyCode: "asc" }]
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          stockMove: {
            include: {
              supplier: {
                select: { id: true, name: true }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  return clients.map((client) => {
    const totalVolumeXaf = client.transactions.reduce((sum, tx) => {
      return sum + (tx.type === "BUY" ? toNumber(tx.amountReceived) : toNumber(tx.amountGiven));
    }, 0);

    return {
      id: client.id,
      name: client.name,
      contact: client.contact,
      createdAt: client.createdAt,
      fixedRates: client.fixedRates.map((rate) => ({
        id: rate.id,
        clientId: rate.clientId,
        currencyCode: rate.currencyCode,
        buyRate: rate.buyRate ? toNumber(rate.buyRate) : null,
        sellRate: rate.sellRate ? toNumber(rate.sellRate) : null
      })),
      debts: client.debts.map((debt) => ({
        id: debt.id,
        currencyCode: debt.currencyCode,
        amount: toNumber(debt.amount),
        note: debt.note,
        updatedAt: debt.updatedAt
      })),
      recentTransactions: client.transactions.slice(0, 12).map((tx) => ({
        id: tx.id,
        receiptNumber: tx.receiptNumber,
        type: tx.type,
        currencyCode: tx.currencyCode,
        amountGiven: toNumber(tx.amountGiven),
        amountReceived: toNumber(tx.amountReceived),
        rateUsed: toNumber(tx.rateUsed),
        createdAt: tx.createdAt,
        createdBy: tx.createdBy.name,
        supplierName: tx.stockMove?.supplier?.name ?? null
      })),
      summary: {
        totalTransactions: client.transactions.length,
        totalVolumeXaf,
        lastTransactionAt: client.transactions[0]?.createdAt ?? null,
        debtCurrencies: client.debts.filter((debt) => !debt.amount.isZero()).length
      }
    };
  });
}
