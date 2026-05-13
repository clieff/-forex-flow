import { Role, type Currency, type RateHistory, type Transaction } from "@prisma/client";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { getStockBalances } from "@/lib/stock";

type TransactionWithCurrency = Transaction & {
  currency: Currency;
};

function getMarginEstimate(transaction: TransactionWithCurrency) {
  const midRate = (toNumber(transaction.currency.buyRate) + toNumber(transaction.currency.sellRate)) / 2;
  const effectiveRate = toNumber(transaction.rateUsed);
  const amountGiven = toNumber(transaction.amountGiven);
  const amountReceived = toNumber(transaction.amountReceived);

  return transaction.type === "BUY" ? (midRate - effectiveRate) * amountGiven : (effectiveRate - midRate) * amountReceived;
}

export async function getDashboardData() {
  const today = new Date();
  const monthStart = subDays(today, 29);
  const weekStart = subDays(today, 6);

  const [transactions, currencies, histories] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfDay(monthStart),
          lte: endOfDay(today)
        }
      },
      include: {
        currency: true,
        createdBy: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.currency.findMany({
      orderBy: {
        code: "asc"
      }
    }),
    prisma.rateHistory.findMany({
      orderBy: {
        changedAt: "desc"
      },
      take: 20,
      include: {
        changedBy: true,
        currency: true
      }
    })
  ]);

  const weeklyBuckets = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(today, 6 - index);
    const sameDay = transactions.filter((transaction) => isSameDay(transaction.createdAt, date));
    return {
      day: format(date, "EEE"),
      buyVolume: sameDay
        .filter((transaction) => transaction.type === "BUY")
        .reduce((sum, transaction) => sum + toNumber(transaction.amountReceived), 0),
      sellVolume: sameDay
        .filter((transaction) => transaction.type === "SELL")
        .reduce((sum, transaction) => sum + toNumber(transaction.amountGiven), 0)
    };
  });

  const totalVolume = transactions.reduce((sum, transaction) => sum + toNumber(transaction.amountReceived), 0);
  const estimatedMargin = transactions.reduce((sum, transaction) => sum + getMarginEstimate(transaction), 0);
  const todayTransactions = transactions.filter((transaction) => isSameDay(transaction.createdAt, today));

  const groupedByCurrency = currencies.map((currency) => {
    const related = transactions.filter((transaction) => transaction.currencyCode === currency.code);
    const buyVolume = related
      .filter((transaction) => transaction.type === "BUY")
      .reduce((sum, transaction) => sum + toNumber(transaction.amountReceived), 0);
    const sellVolume = related
      .filter((transaction) => transaction.type === "SELL")
      .reduce((sum, transaction) => sum + toNumber(transaction.amountGiven), 0);

    return {
      code: currency.code,
      name: currency.name,
      buyVolume,
      sellVolume,
      spread: Number((toNumber(currency.sellRate) - toNumber(currency.buyRate)).toFixed(2)),
      buyRate: toNumber(currency.buyRate),
      sellRate: toNumber(currency.sellRate)
    };
  });

  const topCurrency = [...groupedByCurrency].sort((a, b) => b.buyVolume + b.sellVolume - (a.buyVolume + a.sellVolume))[0];

  const sparkline = Array.from({ length: 10 }).map((_, index) => {
    const date = subDays(today, 9 - index);
    const sameDay = transactions.filter((transaction) => isSameDay(transaction.createdAt, date));
    return {
      label: format(date, "dd/MM"),
      volume: sameDay.reduce((sum, transaction) => sum + toNumber(transaction.amountReceived), 0),
      count: sameDay.length,
      margin: sameDay.reduce((sum, transaction) => sum + getMarginEstimate(transaction), 0)
    };
  });

  const rateTickers = currencies.map((currency) => {
    const currentMid = (toNumber(currency.buyRate) + toNumber(currency.sellRate)) / 2;
    const previousChange = histories.find((history) => history.currencyCode === currency.code);
    const previousMid = previousChange
      ? (toNumber(previousChange.oldBuyRate) + toNumber(previousChange.oldSellRate)) / 2
      : currentMid;
    const delta = previousMid === 0 ? 0 : ((currentMid - previousMid) / previousMid) * 100;

    return {
      label: `${currency.code}/XAF`,
      value: currentMid,
      delta
    };
  });

  const usd = currencies.find((currency) => currency.code === "USD");
  const eur = currencies.find((currency) => currency.code === "EUR");
  if (usd && eur) {
    const eurUsd =
      ((toNumber(eur.buyRate) + toNumber(eur.sellRate)) / 2) / ((toNumber(usd.buyRate) + toNumber(usd.sellRate)) / 2);
    rateTickers.unshift({
      label: "EUR/USD",
      value: eurUsd,
      delta: rateTickers[0]?.delta ?? 0
    });
  }

  // Classement des agents
  const agentRankings = Object.values(
    transactions.reduce((acc, tx) => {
      const agentId = tx.createdById;
      if (!acc[agentId]) {
        acc[agentId] = { id: agentId, name: tx.createdBy.name, volume: 0, count: 0 };
      }
      acc[agentId].volume += toNumber(tx.amountReceived);
      acc[agentId].count += 1;
      return acc;
    }, {} as Record<string, { id: string; name: string; volume: number; count: number }>)
  ).sort((a, b) => b.volume - a.volume);

  return {
    summary: {
      totalVolume,
      estimatedMargin,
      todayTransactionCount: todayTransactions.length,
      topCurrency: topCurrency?.code ?? "USD"
    },
    sparkline,
    weeklyBuckets,
    groupedByCurrency,
    rateTickers,
    recentTransactions: transactions.slice(0, 8),
    recentRateChanges: histories,
    currencies,
    agentRankings
  };
}

export async function getRateManagementData() {
  const [currencies, histories] = await Promise.all([
    prisma.currency.findMany({
      orderBy: {
        code: "asc"
      }
    }),
    prisma.rateHistory.findMany({
      include: {
        changedBy: true
      },
      orderBy: {
        changedAt: "desc"
      },
      take: 12
    })
  ]);

  const currenciesDto = currencies.map((currency) => ({
    ...currency,
    buyRate: toNumber(currency.buyRate),
    sellRate: toNumber(currency.sellRate)
  }));

  return { currencies: currenciesDto, histories };
}

export async function getTransactionFormData(role: Role) {
  const [currencies, recentTransactions, clients, suppliers, stockBalances] = await Promise.all([
    prisma.currency.findMany({
      orderBy: { code: "asc" }
    }),
    prisma.transaction.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        currency: true,
        createdBy: true
      }
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        fixedRates: true
      }
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" }
    }),
    getStockBalances()
  ]);

  const currenciesDto = currencies.map((currency) => ({
    ...currency,
    buyRate: toNumber(currency.buyRate),
    sellRate: toNumber(currency.sellRate)
  }));

  const clientsDto = clients.map(client => ({
    ...client,
    fixedRates: client.fixedRates.map(rate => ({
      ...rate,
      buyRate: rate.buyRate ? toNumber(rate.buyRate) : null,
      sellRate: rate.sellRate ? toNumber(rate.sellRate) : null
    }))
  }));

  return { 
    currencies: currenciesDto, 
    recentTransactions, 
    role, 
    clients: clientsDto,
    suppliers,
    stockBalances
  };
}

export async function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      currency: true,
      createdBy: true,
      client: true
    }
  });
}
