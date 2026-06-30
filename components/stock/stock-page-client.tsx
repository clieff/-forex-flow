"use client";

import { useMemo, useState } from "react";
import { Download, FileText, ReceiptText, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toNumber } from "@/lib/decimal";
import { StockMovementForm } from "@/components/stock/stock-movement-form";
import { formatMoney } from "@/lib/formatters";

type BalanceItem = {
  code: string;
  name: string;
  inTotal: number;
  outTotal: number;
  balance: number;
  weightedBuyRate: number | null;
  suppliers: Array<{
    id: string;
    name: string;
    balance: number;
    debt: number;
    averageBuyRate: number | null;
    lastBuyRate: number | null;
  }>;
};

type LastInvoice = {
  moveId: string;
  currencyCode: string;
  direction: "IN" | "OUT";
  amount: number;
  unitPrice: number | null;
  totalCostXaf: number | null;
  supplierName: string | null;
  note: string | null;
  reason: string;
  createdAt: string;
};

export function StockPageClient({ balances }: { balances: BalanceItem[] }) {
  const [lastInvoice, setLastInvoice] = useState<LastInvoice | null>(null);

  const totals = useMemo(() => {
    const stockValue = balances.reduce((sum, item) => sum + item.balance, 0);
    const supplierCount = balances.reduce((sum, item) => sum + item.suppliers.length, 0);
    return {
      currencies: balances.length,
      supplierCount,
      stockValue
    };
  }, [balances]);

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-premium text-forex-muted">Inventory Control</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Stock devises et facture fournisseur</h2>
            <p className="mt-2 text-sm text-forex-muted">
              Toute l’opération se fait sur une seule page: saisie du mouvement, aperçu de la facture, téléchargement PDF
              et lecture des balances en direct.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5">{totals.currencies} devises</Badge>
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5">{totals.supplierCount} lignes fournisseur</Badge>
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5">Stock: {formatMoney(totals.stockValue)}</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 md:space-y-6">
          <StockMovementForm
            onCreated={(payload) => setLastInvoice(payload)}
          />

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Balances par devise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devise</TableHead>
                      <TableHead>Entrées</TableHead>
                      <TableHead>Sorties</TableHead>
                      <TableHead>Solde</TableHead>
                      <TableHead>Prix moyen achat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((balance) => (
                      <TableRow key={balance.code}>
                        <TableCell>
                          <p className="font-semibold text-white">{balance.code}</p>
                          <p className="text-sm text-forex-muted">{balance.name}</p>
                        </TableCell>
                        <TableCell>{toNumber(balance.inTotal).toFixed(2)}</TableCell>
                        <TableCell>{toNumber(balance.outTotal).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">{toNumber(balance.balance).toFixed(2)}</TableCell>
                        <TableCell>{balance.weightedBuyRate ? toNumber(balance.weightedBuyRate).toFixed(4) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-forex-mint" />
                Facture sur la même page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!lastInvoice ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-forex-muted">
                  Une fois un mouvement fournisseur enregistré, la facture apparaîtra ici avec le lien PDF.
                </div>
              ) : (
                <>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-forex-muted">Référence</p>
                        <p className="mt-1 font-mono text-sm text-white">{lastInvoice.moveId.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <Badge className="border-white/10 bg-white/[0.05]">
                        {lastInvoice.direction === "IN" ? "Entrée" : "Sortie"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm">
                      <Line label="Fournisseur" value={lastInvoice.supplierName ?? "Fournisseur inconnu"} />
                      <Line label="Devise" value={lastInvoice.currencyCode} />
                      <Line label="Quantité" value={lastInvoice.amount.toFixed(2)} />
                      <Line label="Prix unitaire" value={lastInvoice.unitPrice ? `${lastInvoice.unitPrice.toFixed(4)} XAF` : "-"} />
                      <Line label="Coût total" value={lastInvoice.totalCostXaf ? `${lastInvoice.totalCostXaf.toFixed(2)} XAF` : "-"} />
                      <Line label="Motif" value={lastInvoice.reason} />
                      <Line label="Note" value={lastInvoice.note ?? "-"} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/stock/movements/${lastInvoice.moveId}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-gradient px-5 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.01]"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Ouvrir le PDF
                    </a>
                    <a
                      href={`/api/stock/movements/${lastInvoice.moveId}/invoice`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-forex-border bg-white/5 px-5 text-sm font-semibold text-forex-text transition hover:bg-white/10"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Télécharger
                    </a>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050A12]">
                    <iframe
                      title="Aperçu de la facture"
                      src={`/api/stock/movements/${lastInvoice.moveId}/invoice`}
                      className="h-[720px] w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-forex-mint" />
                Dernier mouvement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-forex-muted">
              <p className="leading-6">
                Le formulaire ci-dessus met à jour le stock, la dette fournisseur et le prix moyen.
                La facture est générée automatiquement juste après l’enregistrement.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.2em] text-forex-muted">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}
