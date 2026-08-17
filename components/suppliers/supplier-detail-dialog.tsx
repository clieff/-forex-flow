"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownUp,
  BadgeDollarSign,
  Boxes,
  Calendar,
  Clock3,
  Contact,
  Download,
  History,
  Info,
  TrendingUp,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Position = {
  currencyCode: string;
  stockBalance: number;
  debtBalance: number;
  totalPurchased: number;
  totalSold: number;
  averageBuyRate: number | null;
  lastBuyRate: number | null;
};

type Movement = {
  id: string;
  currencyCode: string;
  direction: "IN" | "OUT";
  reason: string;
  amount: number;
  note: string | null;
  unitPrice: number | null;
  totalCostXaf: number | null;
  createdAt: string | Date;
  createdBy: string;
  receiptNumber: string | null;
};

type SupplierDetails = {
  id: string;
  name: string;
  contact: string | null;
  createdAt: string | Date;
  positions: Position[];
  debts: any[];
  movements: Movement[];
  summary: {
    totalMovements: number;
    outstandingDebt: number;
    lastMovementAt: string | Date | null;
  };
};

interface SupplierDetailDialogProps {
  supplierId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierDetailDialog({
  supplierId,
  isOpen,
  onClose,
}: SupplierDetailDialogProps) {
  const [supplier, setSupplier] = useState<SupplierDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setSupplier(data.supplier);
      }
    } catch (error) {
      console.error("Failed to fetch supplier details", error);
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
        {!supplier || loading ? (
          <div className="flex h-[500px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forex-mint border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col h-[85vh]">
            {/* Header section with profile overview */}
            <div className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] px-6 py-6">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge className="border-forex-mint/30 text-forex-mint uppercase tracking-widest text-[10px]">
                      Partenaire Liquidation
                    </Badge>
                    <DialogTitle className="text-3xl font-bold tracking-tight text-white mt-2">
                      {supplier.name}
                    </DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-forex-muted mt-2">
                       <span className="flex items-center gap-1.5">
                         <Contact className="h-4 w-4" />
                         {supplier.contact || "Pas de contact"}
                       </span>
                       <span className="flex items-center gap-1.5">
                         <Calendar className="h-4 w-4" />
                         Depuis le {new Date(supplier.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase tracking-widest text-forex-muted">Dette Totale Consolidee</p>
                     <p className={cn(
                       "text-2xl font-bold tabular-nums mt-1",
                       supplier.summary.outstandingDebt > 0 ? "text-red-400" : supplier.summary.outstandingDebt < 0 ? "text-emerald-400" : "text-white"
                     )}>
                       {supplier.summary.outstandingDebt.toLocaleString()} <span className="text-xs font-normal text-forex-muted">Devises</span>
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid gap-8">

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={ArrowDownUp}
                    label="Volume Operations"
                    value={String(supplier.summary.totalMovements)}
                    sub="Mouvements enregistres"
                  />
                  <StatCard
                    icon={Boxes}
                    label="Devises en Stock"
                    value={String(supplier.positions.filter(p => p.stockBalance !== 0).length)}
                    sub="Lignes actives"
                  />
                  <StatCard
                    icon={Clock3}
                    label="Dernier Echange"
                    value={supplier.summary.lastMovementAt ? new Date(supplier.summary.lastMovementAt).toLocaleDateString() : "--"}
                    sub="Activite recente"
                  />
                </div>

                {/* Positions section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Boxes className="h-5 w-5 text-forex-mint" />
                    <h3 className="text-lg font-semibold text-white">Positions par devise</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supplier.positions.map((pos) => (
                      <div key={pos.currencyCode} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold">{pos.currencyCode}</span>
                          <Badge className="bg-white/10 text-white border-none">
                            {pos.stockBalance > 0 ? "En Stock" : "Vide"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                           <PositionLine label="Solde Stock" value={pos.stockBalance} />
                           <PositionLine
                            label="Dette / Creance"
                            value={pos.debtBalance}
                            color={pos.debtBalance > 0 ? "text-red-400" : pos.debtBalance < 0 ? "text-emerald-400" : undefined}
                           />
                           <div className="h-px bg-white/5 my-2 w-full" />
                           <PositionLine label="PMA (Achat)" value={pos.averageBuyRate} isRate />
                           <PositionLine label="Dernier Taux" value={pos.lastBuyRate} isRate />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Transaction History section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-forex-mint" />
                      <h3 className="text-lg font-semibold text-white">Historique des 100 derniers mouvements</h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.01] overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03]">
                          <th className="px-4 py-3 font-medium text-forex-muted">Date</th>
                          <th className="px-4 py-3 font-medium text-forex-muted">Type</th>
                          <th className="px-4 py-3 font-medium text-forex-muted">Devise</th>
                          <th className="px-4 py-3 font-medium text-forex-muted text-right">Montant</th>
                          <th className="px-4 py-3 font-medium text-forex-muted text-right">Taux</th>
                          <th className="px-4 py-3 font-medium text-forex-muted">Agent</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {supplier.movements.map((move) => (
                          <tr key={move.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-forex-muted">
                              {new Date(move.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md",
                                move.direction === "IN" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              )}>
                                {move.reason === "SUPPLIER_PURCHASE" ? "ACHAT" : move.reason}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold">{move.currencyCode}</td>
                            <td className={cn(
                              "px-4 py-3 text-right font-mono font-medium",
                              move.direction === "IN" ? "text-emerald-400" : "text-red-400"
                            )}>
                              {move.direction === "IN" ? "+" : "-"}{move.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-forex-muted font-mono">
                              {move.unitPrice?.toFixed(4) || "--"}
                            </td>
                            <td className="px-4 py-3 text-xs text-forex-muted">{move.createdBy}</td>
                            <td className="px-4 py-3 text-right">
                               <button className="text-forex-muted hover:text-white transition">
                                 <Download className="h-4 w-4" />
                               </button>
                            </td>
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

function StatCard({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string, subText?: string, sub?: string }) {
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

function PositionLine({ label, value, color, isRate }: { label: string, value: number | null, color?: string, isRate?: boolean }) {
  if (value === null) return null;
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-forex-muted">{label}</span>
      <span className={cn("font-semibold tabular-nums", color || "text-white")}>
        {isRate ? value.toFixed(4) : value.toLocaleString()}
      </span>
    </div>
  );
}
