import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Filter, Download, Receipt } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/formatters";
import { toNumber } from "@/lib/decimal";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Type, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface SearchParams {
  page?: string;
  type?: string;
  currency?: string;
  from?: string;
  to?: string;
  q?: string;
  agent?: string;
}

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const type = (searchParams.type === "BUY" || searchParams.type === "SELL" ? searchParams.type : undefined) as Type | undefined;
  const currency = searchParams.currency?.trim() || undefined;
  const from = searchParams.from ? new Date(searchParams.from) : undefined;
  const to = searchParams.to ? new Date(searchParams.to + "T23:59:59") : undefined;
  const q = searchParams.q?.trim() || undefined;

  const where: Prisma.TransactionWhereInput = {
    ...(type ? { type } : {}),
    ...(currency ? { currencyCode: currency } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? { OR: [{ clientName: { contains: q, mode: "insensitive" as const } }, { receiptNumber: { contains: q, mode: "insensitive" as const } }] } : {})
  };

  const [total, transactions, currencies, agents] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { currency: true, createdBy: { select: { name: true } }, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.currency.findMany({ orderBy: { code: "asc" }, select: { code: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      {/* En-tête */}
      <section className="panel p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-premium text-forex-muted">Transaction Ledger</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white">Historique des transactions</h2>
            <p className="mt-2 text-sm text-forex-muted">
              {total} transaction{total > 1 ? "s" : ""} au total — paginées par {PAGE_SIZE}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href={`/api/transactions/export?${new URLSearchParams({
                ...(type ? { type } : {}),
                ...(currency ? { currency } : {}),
                ...(searchParams.from ? { from: searchParams.from } : {}),
                ...(searchParams.to ? { to: searchParams.to } : {}),
                ...(q ? { q } : {})
              }).toString()}`}
              target="_blank"
            >
              <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-forex-muted transition hover:border-forex-mint/30 hover:text-forex-mint">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-forex-muted" />
            <CardTitle>Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            currencies={currencies.map((c) => c.code)}
            currentFilters={{
              type: searchParams.type,
              currency: searchParams.currency,
              from: searchParams.from,
              to: searchParams.to,
              q: searchParams.q
            }}
          />
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Badge className="border-white/10 bg-white/[0.05]">
              Page {page} / {totalPages || 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réf.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Donné</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-forex-muted">
                    Aucune transaction trouvée.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs text-forex-muted">
                      {tx.receiptNumber ?? tx.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          tx.type === "BUY"
                            ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint"
                            : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger"
                        }
                      >
                        {tx.type === "BUY" ? "Achat" : "Vente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-white">{tx.currencyCode}</TableCell>
                    <TableCell>{toNumber(tx.amountGiven).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold">{formatMoney(toNumber(tx.amountReceived))}</TableCell>
                    <TableCell className="text-forex-mint">{toNumber(tx.rateUsed).toFixed(2)}</TableCell>
                    <TableCell className="text-forex-muted">{tx.client?.name ?? tx.clientName ?? "Walk-in"}</TableCell>
                    <TableCell className="text-forex-muted">{tx.createdBy.name}</TableCell>
                    <TableCell className="text-xs text-forex-muted">
                      {new Date(tx.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/api/transaction/${tx.id}/receipt`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-forex-muted transition hover:border-forex-mint/30 hover:text-forex-mint"
                      >
                        <Receipt className="h-3 w-3" />
                        Reçu
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 text-forex-muted">…</span>
                    )}
                    <Link
                      href={`?${new URLSearchParams({
                        ...(type ? { type } : {}),
                        ...(currency ? { currency } : {}),
                        ...(searchParams.from ? { from: searchParams.from } : {}),
                        ...(searchParams.to ? { to: searchParams.to } : {}),
                        ...(q ? { q } : {}),
                        page: String(p)
                      }).toString()}`}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition-all ${
                        p === page
                          ? "border-forex-mint/40 bg-forex-mint/10 text-forex-mint"
                          : "border-white/10 bg-white/[0.03] text-forex-muted hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
