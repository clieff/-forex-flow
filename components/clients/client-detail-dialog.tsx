"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BadgePercent,
  Calendar,
  Contact,
  Download,
  HandCoins,
  History,
  ReceiptText,
  User,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";

type Transaction = {
  id: string;
  receiptNumber: string | null;
  type: "BUY" | "SELL";
  currencyCode: string;
  amountGiven: number;
  amountReceived: number;
  rateUsed: number;
  createdAt: string | Date;
  createdBy: string;
  supplierName: string | null;
};

type ClientDetails = {
  id: string;
  name: string;
  contact: string | null;
  createdAt: string | Date;
  fixedRates: any[];
  debts: any[];
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalVolumeXaf: number;
    lastTransactionAt: string | Date | null;
    debtCurrencies: number;
  };
};

interface ClientDetailDialogProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailDialog({
  clientId,
  isOpen,
  onClose,
}: ClientDetailDialogProps) {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Failed to fetch client details", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={fetchDetails}
        className="max-w-4xl border-white/10 bg-[#0B121F] text-white p-0 overflow-hidden shadow-2xl"
      >
        {!client || loading ? (
          <div className="flex h-[500px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forex-mint border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col h-[85vh]">
            <div className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] px-6 py-6">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge className="border-forex-mint/30 text-forex-mint uppercase tracking-widest text-[10px]">
                      Profil Client
                    </Badge>
                    <DialogTitle className="text-3xl font-bold tracking-tight text-white mt-2">
                      {client.name}
                    </DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-forex-muted mt-2">
                       <span className="flex items-center gap-1.5">
                         <Contact className="h-4 w-4" />
                         {client.contact || "Pas de contact"}
                       </span>
                       <span className="flex items-center gap-1.5">
                         <Calendar className="h-4 w-4" />
                         Enregistre le {new Date(client.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase tracking-widest text-forex-muted">Volume Total Brasse</p>
                     <p className="text-2xl font-bold tabular-nums text-white mt-1">
                       {formatMoney(client.summary.totalVolumeXaf)}
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid gap-8">

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={ReceiptText}
                    label="Nombre d'operations"
                    value={String(client.summary.totalTransactions)}
                    sub="Transactions totales"
                  />
                  <StatCard
                    icon={HandCoins}
                    label="Dettes Actives"
                    value={String(client.summary.debtCurrencies)}
                    sub="Devises concernees"
                  />
                  <StatCard
                    icon={History}
                    label="Dernier passage"
                    value={client.summary.lastTransactionAt ? new Date(client.summary.lastTransactionAt).toLocaleDateString() : "--"}
                    sub="Date d'activite"
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <HandCoins className="h-5 w-5 text-forex-mint" />
                      <h3 className="text-lg font-semibold text-white">Etat des dettes</h3>
                    </div>
                    <div className="space-y-3">
                      {client.debts.length > 0 ? (
                        client.debts.map((debt) => (
                          <div key={debt.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold">{debt.currencyCode}</p>
                              <p className="text-xs text-forex-muted">Mise a jour: {new Date(debt.updatedAt).toLocaleDateString()}</p>
                            </div>
                            <span className={cn(
                              "text-xl font-bold tabular-nums",
                              debt.amount > 0 ? "text-red-400" : "text-emerald-400"
                            )}>
                              {debt.amount.toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-forex-muted">
                          Aucune dette en cours.
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <BadgePercent className="h-5 w-5 text-forex-mint" />
                      <h3 className="text-lg font-semibold text-white">Taux preferentiels</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {client.fixedRates.length > 0 ? (
                        client.fixedRates.map((rate) => (
                          <div key={rate.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-sm font-bold mb-3">{rate.currencyCode}</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-emerald-400">Achat: {rate.buyRate || "--"}</span>
                              <span className="text-rose-400">Vente: {rate.sellRate || "--"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-forex-muted">
                          Aucun taux fixe configure.
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-forex-mint" />
                    <h3 className="text-lg font-semibold text-white">Historique complet des actions</h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.01] overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03]">
                          <th className="px-4 py-3 font-medium text-forex-muted">Date</th>
                          <th className="px-4 py-3 font-medium text-forex-muted">Type</th>
                          <th className="px-4 py-3 font-medium text-forex-muted text-right">Donne</th>
                          <th className="px-4 py-3 font-medium text-forex-muted text-right">Recu</th>
                          <th className="px-4 py-3 font-medium text-forex-muted text-right">Taux</th>
                          <th className="px-4 py-3 font-medium text-forex-muted">Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {client.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-forex-muted">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn(
                                "text-[10px] font-bold border-none",
                                tx.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              )}>
                                {tx.type === "BUY" ? "ACHAT" : "VENTE"} {tx.currencyCode}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-white">
                              {tx.amountGiven.toLocaleString()} {tx.type === "BUY" ? tx.currencyCode : "XAF"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-forex-mint">
                              {tx.amountReceived.toLocaleString()} {tx.type === "BUY" ? "XAF" : tx.currencyCode}
                            </td>
                            <td className="px-4 py-3 text-right text-forex-muted font-mono">
                              {tx.rateUsed.toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-xs text-forex-muted">{tx.createdBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3 text-forex-muted mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-forex-muted mt-1 uppercase tracking-tight">{sub}</div>
    </div>
  );
}
