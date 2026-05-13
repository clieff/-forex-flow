import { ArrowUpRight, Coins, Landmark, WalletCards, Trophy } from "lucide-react";
import { PageTransition } from "@/components/dashboard/page-transition";
import { MetricCard } from "@/components/dashboard/metric-card";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { RateTicker } from "@/components/dashboard/rate-ticker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardData } from "@/lib/dashboard";
import { formatCompact, formatMoney } from "@/lib/formatters";
import { toNumber } from "@/lib/decimal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const lastPoint = data.sparkline.at(-1);
  const prevPoint = data.sparkline.at(-2);
  const change = prevPoint?.volume ? (((lastPoint?.volume ?? 0) - prevPoint.volume) / prevPoint.volume) * 100 : 8.4;
  const marginChange = prevPoint?.margin ? (((lastPoint?.margin ?? 0) - prevPoint.margin) / prevPoint.margin) * 100 : 5.2;
  const txChange = prevPoint?.count ? (((lastPoint?.count ?? 0) - prevPoint.count) / prevPoint.count) * 100 : 3.1;

  return (
    <PageTransition className="space-y-6">
      <RateTicker items={data.rateTickers} />

      <section className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Volume total"
          value={formatMoney(data.summary.totalVolume)}
          change={change}
          data={data.sparkline.map((item) => ({ value: item.volume }))}
        />
        <MetricCard
          label="Marge estimee"
          value={formatMoney(data.summary.estimatedMargin)}
          change={marginChange}
          data={data.sparkline.map((item) => ({ value: item.margin }))}
        />
        <MetricCard
          label="Transactions du jour"
          value={String(data.summary.todayTransactionCount)}
          change={txChange}
          data={data.sparkline.map((item) => ({ value: item.count }))}
        />
        <Card className="min-h-[220px]">
          <CardHeader>
            <CardTitle>Devise dominante</CardTitle>
            <p className="text-4xl font-semibold text-white">{data.summary.topCurrency}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Desk", value: "Live", icon: Coins },
                { label: "Spread", value: "Adaptive", icon: Landmark },
                { label: "Receipt", value: "PDF", icon: WalletCards }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <item.icon className="h-4 w-4 text-forex-mint" />
                  <p className="mt-3 text-xs uppercase tracking-premium text-forex-muted">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[24px] border border-forex-mint/15 bg-forex-mint/10 p-4 text-sm text-forex-text">
              Momentum fort sur {data.summary.topCurrency}. Les flux recents suggerent un bon levier de spread intraday.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <VolumeChart data={data.weeklyBuckets} />

        <Card>
          <CardHeader>
            <CardTitle>Radar des devises</CardTitle>
            <p className="text-sm text-forex-muted">Lecture synthese des volumes, spreads et signaux.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.groupedByCurrency.map((item) => (
              <div key={item.code} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{item.code}</p>
                    <p className="text-sm text-forex-muted">{item.name}</p>
                  </div>
                  <Badge className="border-forex-mint/20 bg-forex-mint/10 text-forex-mint">
                    Spread {item.spread.toFixed(2)}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-[#0F1625] p-3">
                    <p className="text-forex-muted">Achat</p>
                    <p className="mt-1 font-semibold text-white">{formatCompact(item.buyVolume)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#0F1625] p-3">
                    <p className="text-forex-muted">Vente</p>
                    <p className="mt-1 font-semibold text-white">{formatCompact(item.sellVolume)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dernieres transactions</CardTitle>
                <p className="mt-2 text-sm text-forex-muted">Flux recents de caisse avec taux gele par operation.</p>
              </div>
              <Badge className="border-white/10 bg-white/[0.05]">{data.recentTransactions.length} lignes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.clientName ?? "Walk-in"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          transaction.type === "BUY"
                            ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint"
                            : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.currencyCode}</TableCell>
                    <TableCell>{formatMoney(toNumber(transaction.amountReceived))}</TableCell>
                    <TableCell>{transaction.createdBy.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activite des taux</CardTitle>
            <p className="text-sm text-forex-muted">Dernieres modifications appliquees par les admins.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentRateChanges.map((change) => (
              <div key={change.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-premium text-forex-muted">{change.currency.code}</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {change.newBuyRate.toFixed(2)} / {change.newSellRate.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-full bg-forex-mint/10 px-3 py-1 text-sm text-forex-mint">
                    <ArrowUpRight className="mr-1 inline h-4 w-4" />
                    Updated
                  </div>
                </div>
                <p className="mt-3 text-sm text-forex-muted">
                  {change.changedBy.name} a ajuste le spread depuis {change.oldBuyRate.toFixed(2)} /{" "}
                  {change.oldSellRate.toFixed(2)}.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Classement des agents */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-forex-mint" />
              <CardTitle>Classement des Agents (30 jours)</CardTitle>
            </div>
            <p className="text-sm text-forex-muted">Performance de l'équipe basée sur le volume de transactions.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.agentRankings.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 font-semibold text-white/50">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{agent.name}</p>
                      <p className="text-xs text-forex-muted">{agent.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-forex-mint">{formatCompact(agent.volume)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-forex-muted">Volume XAF</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </PageTransition>
  );
}
