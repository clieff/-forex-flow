import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Filter, History } from "lucide-react";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLogs } from "@/lib/logs";
import { LogFilters } from "@/components/logs/log-filters";
import { LogCategory } from "@prisma/client";
import { SyncLogsButton } from "@/components/logs/sync-logs-button";

export const dynamic = "force-dynamic";

interface SearchParams {
  page?: string;
  category?: string;
  from?: string;
  to?: string;
  q?: string;
}

export default async function LogsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const category = searchParams.category as LogCategory | undefined;
  const from = searchParams.from ? new Date(searchParams.from) : undefined;
  const to = searchParams.to ? new Date(searchParams.to + "T23:59:59") : undefined;
  const q = searchParams.q?.trim() || undefined;

  const { logs, total, totalPages } = await getLogs({
    page,
    category,
    from,
    to,
    q,
    pageSize: 30
  });

  const categoryColors: Record<LogCategory, string> = {
    TRANSACTION: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    STOCK: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    CASH: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    RATE: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    USER: "border-pink-500/20 bg-pink-500/10 text-pink-400",
    SYSTEM: "border-slate-500/20 bg-slate-500/10 text-slate-400"
  };

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-premium text-forex-muted">Audit Surface</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white">Journal d'activité universel</h2>
            <p className="mt-2 text-sm text-forex-muted">
              Historique complet de tous les mouvements et actions effectués sur la plateforme.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SyncLogsButton />
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs md:text-sm md:px-4 md:py-2">
              {total} entrées enregistrées
            </Badge>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-forex-muted" />
            <CardTitle>Filtres de recherche</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <LogFilters
            currentFilters={{
              category: searchParams.category,
              from: searchParams.from,
              to: searchParams.to,
              q: searchParams.q
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Flux d'activités</CardTitle>
            <Badge className="border-white/10 bg-white/[0.05]">
              Page {page} / {totalPages || 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-forex-muted">
                    <History className="mx-auto h-10 w-10 opacity-20 mb-3" />
                    Aucun log trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-forex-muted">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-white">{log.user.name}</p>
                      <p className="text-[10px] text-forex-muted uppercase">{log.user.role}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[log.category]}>
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-white">
                      {log.action}
                    </TableCell>
                    <TableCell className="max-w-md text-sm text-forex-muted">
                      {log.details}
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
                        ...(category ? { category } : {}),
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
