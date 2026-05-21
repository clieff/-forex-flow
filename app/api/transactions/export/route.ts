import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "BUY" | "SELL" | null;
  const currency = searchParams.get("currency");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q");

  const where = {
    ...(type ? { type } : {}),
    ...(currency ? { currencyCode: currency } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59") } : {})
      }
    } : {}),
    ...(q
      ? {
          OR: [
            { clientName: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
            { receiptNumber: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      currency: { select: { code: true, name: true } },
      createdBy: { select: { name: true } },
      client: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 5000 // limite raisonnable pour l'export
  });

  // Générer le CSV
  const headers = ["N° Reçu", "Type", "Devise", "Montant donné", "Montant reçu", "Taux", "Client", "Agent", "Date"];
  const rows = transactions.map((tx) => [
    tx.receiptNumber ?? tx.id.slice(0, 8),
    tx.type === "BUY" ? "Achat" : "Vente",
    tx.currencyCode,
    toNumber(tx.amountGiven).toFixed(2),
    toNumber(tx.amountReceived).toFixed(2),
    toNumber(tx.rateUsed).toFixed(4),
    tx.client?.name ?? tx.clientName ?? "Walk-in",
    tx.createdBy.name,
    new Date(tx.createdAt).toLocaleString("fr-FR")
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "BOM": "\uFEFF"
    }
  });
}
