import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaissePanel } from "@/components/caisse/caisse-panel";
import { getCaisseData } from "@/lib/caisse";
import { formatMoney } from "@/lib/formatters";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  DEPOT: "Dépôt",
  RETRAIT: "Retrait",
  DEPENSE: "Dépense",
  AJUSTEMENT: "Ajustement",
  AUTRE: "Autre"
};

export default async function CaissePage() {
  const { user } = await getServerSession();
  if (!user) redirect("/sign-in");

  const isAdmin = isAdminRole(user.role);
  const data = await getCaisseData();

  // Graphique: adapter le format weeklyBuckets au VolumeChart
  const chartData = data.weeklyFlow.map((d) => ({
    day: d.day,
    buyVolume: d.in,
    sellVolume: d.out
  }));

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      {/* En-tête */}
      <section className="panel p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-premium text-forex-muted">Treasury Desk</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Caisse XAF</h2>
            <p className="mt-2 text-sm text-forex-muted">
              Suivi en temps réel du solde en Franc CFA — entrées, sorties et ajustements.
            </p>
          </div>
          <Badge className={data.balance >= 0 ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint text-base px-4 py-2" : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger text-base px-4 py-2"}>
            <Wallet className="h-4 w-4 mr-2" />
            {formatMoney(data.balance)}
          </Badge>
        </div>
      </section>

      {/* Métriques */}
      <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {[
          {
            label: "Entrées XAF (ventes)",
            value: formatMoney(data.xafIn),
            icon: ArrowDownLeft,
            color: "text-forex-mint",
            bg: "bg-forex-mint/10 border-forex-mint/20"
          },
          {
            label: "Sorties XAF (achats)",
            value: formatMoney(data.xafOut),
            icon: ArrowUpRight,
            color: "text-forex-danger",
            bg: "bg-forex-danger/10 border-forex-danger/20"
          },
          {
            label: "Aujourd'hui — Entrées",
            value: formatMoney(data.todayIn),
            icon: TrendingUp,
            color: "text-forex-mint",
            bg: "bg-forex-mint/10 border-forex-mint/20"
          },
          {
            label: "Aujourd'hui — Sorties",
            value: formatMoney(data.todayOut),
            icon: TrendingDown,
            color: "text-forex-danger",
            bg: "bg-forex-danger/10 border-forex-danger/20"
          }
        ].map((item) => (
          <Card key={item.label} className={`border ${item.bg}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-premium text-forex-muted">{item.label}</p>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Graphique + Formulaire admin */}
      <section className="grid gap-4 md:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Flux XAF — 7 derniers jours</CardTitle>
            <p className="text-sm text-forex-muted">Entrées (ventes) vs Sorties (achats) en XAF.</p>
          </CardHeader>
          <CardContent>
            <VolumeChart data={chartData} />
          </CardContent>
        </Card>

        {isAdmin ? (
          <CaissePanel />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Solde net par flux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Transactions (XAF)", value: data.xafIn - data.xafOut, positive: data.xafIn - data.xafOut >= 0 },
                { label: "Ajustements manuels", value: data.manualIn - data.manualOut, positive: data.manualIn - data.manualOut >= 0 },
                { label: "Solde total", value: data.balance, positive: data.balance >= 0 }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-forex-muted">{row.label}</p>
                  <p className={`font-semibold ${row.positive ? "text-forex-mint" : "text-forex-danger"}`}>
                    {formatMoney(row.value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Historique des mouvements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des mouvements manuels</CardTitle>
          <p className="text-sm text-forex-muted">Dépôts, retraits et ajustements enregistrés par les admins.</p>
        </CardHeader>
        <CardContent>
          {data.movements.length === 0 ? (
            <div className="py-12 text-center text-forex-muted">
              <Wallet className="mx-auto h-10 w-10 opacity-30 mb-3" />
              <p>Aucun mouvement manuel enregistré.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge className={m.direction === "IN"
                        ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint"
                        : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger"
                      }>
                        {m.direction === "IN" ? "Entrée" : "Sortie"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-semibold ${m.direction === "IN" ? "text-forex-mint" : "text-forex-danger"}`}>
                      {m.direction === "IN" ? "+" : "-"}{formatMoney(m.amount)}
                    </TableCell>
                    <TableCell>{REASON_LABELS[m.reason] ?? m.reason}</TableCell>
                    <TableCell className="text-forex-muted">{m.note ?? "—"}</TableCell>
                    <TableCell>{m.createdBy}</TableCell>
                    <TableCell className="text-forex-muted">
                      {new Date(m.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
