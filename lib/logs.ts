import { prisma } from "@/lib/prisma";
import { LogCategory } from "@prisma/client";

export async function createLog({
  category,
  action,
  details,
  userId
}: {
  category: LogCategory;
  action: string;
  details?: string;
  userId: string;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        category,
        action,
        details,
        userId
      }
    });
  } catch (error) {
    console.error("Failed to create log:", error);
  }
}

export async function getLogs(params: {
  category?: LogCategory;
  userId?: string;
  from?: Date;
  to?: Date;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const { category, userId, from, to, q, page = 1, pageSize = 50 } = params;

  const where: any = {
    ...(category ? { category } : {}),
    ...(userId ? { userId } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? {
      OR: [
        { action: { contains: q, mode: "insensitive" } },
        { details: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } }
      ]
    } : {})
  };

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return {
    logs,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function reconstructLogs() {
  const [transactions, stockMoves, cashMoves, rateHistories] = await Promise.all([
    prisma.transaction.findMany({ include: { createdBy: true } }),
    prisma.stockMovement.findMany({ include: { createdBy: true } }),
    prisma.cashMovement.findMany({ include: { createdBy: true } }),
    prisma.rateHistory.findMany({ include: { changedBy: true } })
  ]);

  const logsData = [
    ...transactions.map(tx => ({
      category: "TRANSACTION" as const,
      action: `CREATE_${tx.type}`,
      details: `${tx.amountGiven} ${tx.currencyCode} -> ${tx.amountReceived} XAF (Réf: ${tx.receiptNumber})`,
      userId: tx.createdById,
      createdAt: tx.createdAt
    })),
    ...stockMoves.map(m => ({
      category: "STOCK" as const,
      action: `STOCK_${m.direction}`,
      details: `${m.amount} ${m.currencyCode} - ${m.reason}${m.note ? ` (${m.note})` : ""}`,
      userId: m.createdById,
      createdAt: m.createdAt
    })),
    ...cashMoves.map(m => ({
      category: "CASH" as const,
      action: `CASH_${m.direction}`,
      details: `${m.amount} XAF - ${m.reason}${m.note ? ` (${m.note})` : ""}`,
      userId: m.createdById,
      createdAt: m.createdAt
    })),
    ...rateHistories.map(h => ({
      category: "RATE" as const,
      action: "UPDATE_RATE",
      details: `${h.currencyCode}: Buy ${h.oldBuyRate}->${h.newBuyRate}, Sell ${h.oldSellRate}->${h.newSellRate}`,
      userId: h.changedById,
      createdAt: h.changedAt
    }))
  ];

  // Batch insert if possible or simple loop (since it's a one-time thing)
  // To avoid duplicates, we could check if ActivityLog is empty or use some logic.
  // For safety, let's just clear ActivityLog first if we are doing a full reconstruction.
  
  await prisma.activityLog.deleteMany({});
  
  await prisma.activityLog.createMany({
    data: logsData
  });

  return logsData.length;
}
