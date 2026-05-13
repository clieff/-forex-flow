import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ transactions: [], clients: [] });
  }

  const [transactions, clients] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
          { clientName: { contains: q, mode: "insensitive" } }
        ]
      },
      include: {
        currency: { select: { code: true } }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    }),
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { contact: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return NextResponse.json({
    transactions: transactions.map(tx => ({
      id: tx.id,
      receiptNumber: tx.receiptNumber ?? tx.id.slice(0, 8),
      clientName: tx.clientName ?? "Walk-in",
      type: tx.type,
      currencyCode: tx.currencyCode,
      date: tx.createdAt
    })),
    clients: clients.map(c => ({
      id: c.id,
      name: c.name,
      contact: c.contact
    }))
  });
}
