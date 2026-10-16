import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";

type CaisseFilter = { createdById?: string };

function signedAmount(direction: "IN" | "OUT", amount: number) {
  return direction === "IN" ? amount : -amount;
}

async function getSnapshot(filter: CaisseFilter) {
  const where = filter.createdById ? { createdById: filter.createdById } : {};
  const [accounts, transactions, movements] = await Promise.all([
    prisma.paymentAccount.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    }),
    prisma.transaction.findMany({
      where,
      select: {
        type: true,
        currencyCode: true,
        amountGiven: true,
        amountReceived: true,
        cashAmountXaf: true,
        paymentAccountId: true,
        createdAt: true,
        paymentAccount: { select: { id: true, name: true, kind: true } }
      }
    }),
    prisma.cashMovement.findMany({
      where,
      include: {
        paymentAccount: { select: { id: true, name: true, kind: true } },
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const xafByAccount = new Map(accounts.map((account) => [account.id, 0]));
  const fxCashByCurrency = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.paymentAccountId) {
      const xafImpact =
        transaction.type === "SELL"
          ? toNumber(transaction.cashAmountXaf)
          : -toNumber(transaction.cashAmountXaf);
      xafByAccount.set(
        transaction.paymentAccountId,
        (xafByAccount.get(transaction.paymentAccountId) ?? 0) + xafImpact
      );
    }

    // La devise est physiquement remise ou recue, quel que soit le canal XAF.
    const fxImpact =
      transaction.type === "BUY"
        ? toNumber(transaction.amountGiven)
        : -toNumber(transaction.amountReceived);
    fxCashByCurrency.set(
      transaction.currencyCode,
      (fxCashByCurrency.get(transaction.currencyCode) ?? 0) + fxImpact
    );
  }

  for (const movement of movements) {
    if (!movement.paymentAccountId) continue;
    xafByAccount.set(
      movement.paymentAccountId,
      (xafByAccount.get(movement.paymentAccountId) ?? 0) + signedAmount(movement.direction, toNumber(movement.amount))
    );
  }

  const accountBalances = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    kind: account.kind,
    balance: xafByAccount.get(account.id) ?? 0,
    isActive: account.isActive
  }));

  const xafIn = transactions
    .filter((transaction) => transaction.type === "SELL")
    .reduce((sum, transaction) => sum + toNumber(transaction.cashAmountXaf), 0);
  const xafOut = transactions
    .filter((transaction) => transaction.type === "BUY")
    .reduce((sum, transaction) => sum + toNumber(transaction.cashAmountXaf), 0);
  const manualIn = movements
    .filter((movement) => movement.direction === "IN")
    .reduce((sum, movement) => sum + toNumber(movement.amount), 0);
  const manualOut = movements
    .filter((movement) => movement.direction === "OUT")
    .reduce((sum, movement) => sum + toNumber(movement.amount), 0);

  return {
    balance: accountBalances.reduce((sum, account) => sum + account.balance, 0),
    accountBalances,
    fxCashBalances: [...fxCashByCurrency.entries()]
      .map(([currencyCode, balance]) => ({ currencyCode, balance }))
      .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode)),
    xafIn,
    xafOut,
    manualIn,
    manualOut,
    movements: movements.map((movement) => ({
      id: movement.id,
      direction: movement.direction,
      amount: toNumber(movement.amount),
      accountName: movement.paymentAccount?.name ?? "Non classé",
      reason: movement.reason,
      note: movement.note,
      createdBy: movement.createdBy.name,
      createdAt: movement.createdAt
    }))
  };
}

export async function getCaisseData({
  userId,
  includeGlobal
}: {
  userId: string;
  includeGlobal: boolean;
}) {
  const personal = await getSnapshot({ createdById: userId });
  const global = includeGlobal ? await getSnapshot({}) : null;
  return { personal, global };
}
