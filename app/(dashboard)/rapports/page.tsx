import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { Download, FileText, CalendarDays } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { startOfDay, endOfDay } from "date-fns";
import { formatMoney } from "@/lib/formatters";
import { DatePickerForm } from "@/components/rapports/date-picker-form";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface SearchParams {
  date?: string;
}

export default async function RapportsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const { user } = await getServerSession();
  if (!user || !isAdminRole(user.role)) {
    redirect("/access-denied?from=/rapports");
  }

  const dateStr = searchParams.date;
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  const [transactions, cashMovements] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
      },
      include: {
        currency: true,
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.cashMovement.findMany({
      where: {
        createdAt: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
      }
    })
  ]);

  // Regroupement
  const byCurrency = new Map<string, {
    code: string; name: string;
    buyVolumeFx: number; sellVolumeFx: number;
    xafIn: number; xafOut: number; margin: number;
  }>();

  for (const tx of transactions) {
    const curr = byCurrency.get(tx.currencyCode) ?? {
      code: tx.currencyCode, name: tx.currency.name,
      buyVolumeFx: 0, sellVolumeFx: 0,
      xafIn: 0, xafOut: 0, margin: 0
    };

    const midRate = (toNumber(tx.currency.buyRate) + toNumber(tx.currency.sellRate)) / 2;

    if (tx.type === "BUY") {
      curr.buyVolumeFx += toNumber(tx.amountGiven);
      curr.xafOut += toNumber(tx.amountReceived);
      curr.margin += (midRate - toNumber(tx.rateUsed)) * toNumber(tx.amountGiven);
    } else {
      curr.sellVolumeFx += toNumber(tx.amountReceived);
      curr.xafIn += toNumber(tx.amountGiven);
      curr.margin += (toNumber(tx.rateUsed) - midRate) * toNumber(tx.amountReceived);
    }

    byCurrency.set(tx.currencyCode, curr);
  }

  const totalXafIn = transactions.filter(t => t.type === "SELL").reduce((s, t) => s + toNumber(t.amountGiven), 0);
  const totalXafOut = transactions.filter(t => t.type === "BUY").reduce((s, t) => s + toNumber(t.amountReceived), 0);
  const totalMargin = transactions.reduce((s, t) => {
    const midRate = (toNumber(t.currency.buyRate) + toNumber(t.currency.sellRate)) / 2;
    return s + (t.type === "BUY"
      ? (midRate - toNumber(t.rateUsed)) * toNumber(t.amountGiven)
      : (toNumber(t.rateUsed) - midRate) * toNumber(t.amountReceived));
  }, 0);

  const manualIn = cashMovements.filter(m => m.direction === "IN").reduce((s, m) => s + toNumber(m.amount), 0);
  const manualOut = cashMovements.filter(m => m.direction === "OUT").reduce((s, m) => s + toNumber(m.amount), 0);
  const caisseNet = totalXafIn - totalXafOut + manualIn - manualOut;

  const dateValue = targetDate.toISOString().split("T")[0];

  return (
    <PageTransition className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-premium text-forex-muted">Compliance & Audit</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Rapports et Clôtures</h2>
            <p className="mt-2 text-sm text-forex-muted">
              Générez vos rapports de clôture journalière et exports mensuels de transactions.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* Rapport du jour */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Rapport de clôture journalière</CardTitle>
                <p className="mt-1 text-sm text-forex-muted">Aperçu rapide avant impression.</p>
              </div>
              <DatePickerForm defaultValue={dateValue} />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-premium text-forex-muted mb-4">Transactions & Marges</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forex-muted">Transactions totales</span>
                      <span className="font-semibold">{transactions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forex-muted">Entrées XAF (Ventes)</span>
                      <span className="font-semibold text-forex-mint">+{formatMoney(totalXafIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forex-muted">Sorties XAF (Achats)</span>
                      <span className="font-semibold text-forex-danger">-{formatMoney(totalXafOut)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-forex-muted">Marge brute estimée</span>
                      <span className="font-semibold text-white">{formatMoney(totalMargin)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-premium text-forex-muted mb-4">Mouvements de Caisse XAF</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-forex-muted">Ajustements IN</span>
                      <span className="font-semibold text-forex-mint">+{formatMoney(manualIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-forex-muted">Ajustements OUT</span>
                      <span className="font-semibold text-forex-danger">-{formatMoney(manualOut)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-forex-muted">Solde net du jour</span>
                      <span className={`font-semibold ${caisseNet >= 0 ? "text-forex-mint" : "text-forex-danger"}`}>
                        {formatMoney(caisseNet)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {byCurrency.size > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Activité par devise</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Array.from(byCurrency.values()).map((curr) => (
                      <div key={curr.code} className="flex justify-between items-center rounded-xl border border-white/5 bg-white/[0.01] p-3 text-sm">
                        <span className="font-semibold">{curr.code}</span>
                        <div className="text-right">
                          <p className="text-forex-mint text-xs">+ {curr.buyVolumeFx.toLocaleString("fr-FR")} (Acheté)</p>
                          <p className="text-forex-danger text-xs">- {curr.sellVolumeFx.toLocaleString("fr-FR")} (Vendu)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Link
                  href={`/api/rapports/journalier/pdf?date=${dateValue}`}
                  target="_blank"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forex-mint/10 border border-forex-mint/20 px-4 py-3 font-semibold text-forex-mint transition hover:bg-forex-mint/20"
                >
                  <FileText className="h-5 w-5" />
                  Générer le rapport de clôture PDF
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exports bruts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exports Mensuels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-forex-muted">
                Téléchargez l'historique complet pour la comptabilité sous format CSV.
              </p>
              
              <form action="/api/transactions/export" method="GET" className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-forex-muted">Date de début</label>
                  <input
                    type="date"
                    name="from"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-forex-muted">Date de fin</label>
                  <input
                    type="date"
                    name="to"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/[0.1]"
                >
                  <Download className="h-4 w-4" />
                  Exporter (CSV)
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
