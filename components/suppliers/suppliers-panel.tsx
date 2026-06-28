"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  BadgeDollarSign,
  Boxes,
  Clock3,
  PlusCircle,
  TrendingUp,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SupplierDto } from "@/types/dto";

export function SuppliersPanel() {
  const [items, setItems] = useState<SupplierDto[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/suppliers");
    if (!res.ok) {
      toast.error("Impossible de charger les fournisseurs");
      return;
    }
    const data = (await res.json()) as { suppliers: SupplierDto[] };
    setItems(data.suppliers);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createSupplier() {
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Creation refusee");
      return;
    }

    setName("");
    setContact("");
    toast.success("Fournisseur ajoute");
    await refresh();
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(20,33,51,0.98),rgba(12,20,34,0.96))] p-5 shadow-[0_24px_60px_rgba(3,8,18,0.34)] xl:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,201,167,0.14),transparent_28%),radial-gradient(circle_at_left_center,rgba(0,180,216,0.09),transparent_22%)]" />
        <div className="relative space-y-5">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-base font-semibold uppercase tracking-[0.16em] text-white/90">
              Nouveau fournisseur
            </h3>
            <p className="text-sm leading-6 text-forex-muted">
              Ajoute un partenaire de liquidite avec une fiche nette, elegante et directement exploitable.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_164px]">
            <Input
              placeholder="Nom fournisseur"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-2xl border-white/10 bg-[#101828]/70 text-sm shadow-inner shadow-black/15"
            />
            <Input
              placeholder="Contact (optionnel)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="h-12 rounded-2xl border-white/10 bg-[#101828]/70 text-sm shadow-inner shadow-black/15"
            />
            <Button
              onClick={createSupplier}
              disabled={loading}
              size="lg"
              className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#11d3ca,#00c9a7)] text-[#05131a] shadow-[0_16px_32px_rgba(0,201,167,0.22)] transition hover:brightness-105"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm text-forex-muted">Aucun fournisseur pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:[grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          {items.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierDto }) {
  return (
    <Card className="group relative h-full overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(20,29,45,0.98),rgba(13,20,33,0.98))] shadow-[0_20px_46px_rgba(4,10,20,0.28)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,201,167,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(0,180,216,0.08),transparent_24%)] opacity-80" />
      <CardHeader className="relative gap-5 border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-5 xl:px-6 xl:py-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_188px] md:items-start">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-forex-muted">
              Supplier profile
            </div>
            <CardTitle className="text-xl uppercase tracking-[0.14em] text-white leading-tight">
              {supplier.name}
            </CardTitle>
            <p className="text-sm text-forex-muted break-words" title={supplier.contact ?? undefined}>
              {supplier.contact || "Aucun contact renseigne"}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,32,0.98),rgba(12,24,39,0.96))] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:min-h-[96px] md:text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-forex-muted">
              Dernier mouvement
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {supplier.summary.lastMovementAt
                ? new Date(supplier.summary.lastMovementAt).toLocaleDateString("fr-FR", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "--"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <SupplierStat
            icon={ArrowDownUp}
            label="Mouvements"
            value={String(supplier.summary.totalMovements)}
          />
          <SupplierStat
            icon={BadgeDollarSign}
            label="Dette nette"
            value={supplier.summary.outstandingDebt.toFixed(2)}
          />
          <SupplierStat
            icon={Clock3}
            label="Devises actives"
            value={String(supplier.summary.totalDebtCurrencies)}
            className="col-span-2 lg:col-span-1"
          />
        </div>
      </CardHeader>

      <CardContent className="relative grid gap-5 px-5 py-5 xl:px-6 xl:py-6">
        <PanelSection icon={Boxes} title="Soldes par devise">
          {supplier.positions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
              {supplier.positions.map((position) => (
                <div
                  key={position.currencyCode}
                  className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,24,39,0.95),rgba(9,18,31,0.95))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-white">
                      {position.currencyCode}
                    </p>
                    <span className="rounded-full border border-forex-mint/20 bg-forex-mint/10 p-1.5 text-forex-mint">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <MetricLine label="Stock" value={position.stockBalance.toFixed(2)} />
                    <MetricLine
                      label="Dette"
                      value={position.debtBalance.toFixed(2)}
                      valueClassName={
                        position.debtBalance < 0
                          ? "text-emerald-300"
                          : position.debtBalance > 0
                            ? "text-red-300"
                            : "text-white"
                      }
                    />
                    <MetricLine label="PMA" value={position.averageBuyRate?.toFixed(4) ?? "-"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun mouvement." />
          )}
        </PanelSection>

        <PanelSection icon={BadgeDollarSign} title="Dettes actives">
          {supplier.debts.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {supplier.debts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {debt.currencyCode}
                    </p>
                    <p className="truncate text-xs text-forex-muted">
                      {new Date(debt.updatedAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 text-sm font-semibold tabular-nums",
                      debt.amount < 0
                        ? "text-emerald-300"
                        : debt.amount > 0
                          ? "text-red-300"
                          : "text-white",
                    )}
                  >
                    {debt.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucune dette active." />
          )}
        </PanelSection>

        <PanelSection icon={Clock3} title="Historique recent">
          {supplier.recentMovements.length > 0 ? (
            <div className="grid gap-3">
              {supplier.recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-6 text-white break-words">
                        {movement.direction === "IN" ? "Entree" : "Sortie"} {movement.currencyCode} - {movement.reason}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-forex-muted break-words">
                        {new Date(movement.createdAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        - {movement.createdBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-2xl bg-[#0B1627]/70 px-3 py-2 text-left sm:text-right">
                        <p className="text-base font-semibold tabular-nums text-white">
                          {movement.amount.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm tabular-nums text-forex-mint">
                          {movement.unitPrice ? movement.unitPrice.toFixed(4) : "-"}
                        </p>
                      </div>
                      {(movement.reason === "SUPPLIER_PURCHASE" || movement.reason === "DEBT_SETTLEMENT") && (
                        <button
                          onClick={() => window.open(`/api/stock/movements/${movement.id}/invoice`, "_blank")}
                          className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2 text-forex-muted transition hover:text-white hover:bg-white/[0.08]"
                          title="Telecharger la facture"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {(movement.totalCostXaf || movement.clientName || movement.receiptNumber || movement.note) && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/5 pt-3 text-xs leading-5 text-forex-muted">
                      {movement.totalCostXaf && (
                        <span className="rounded-full bg-white/[0.04] px-2.5 py-1 tabular-nums">Cout: {movement.totalCostXaf.toFixed(2)}</span>
                      )}
                      {movement.clientName && <span className="rounded-full bg-white/[0.04] px-2.5 py-1">Client: {movement.clientName}</span>}
                      {movement.receiptNumber && <span className="rounded-full bg-white/[0.04] px-2.5 py-1">#{movement.receiptNumber}</span>}
                      {movement.note && <span className="rounded-full bg-white/[0.04] px-2.5 py-1">Note: {movement.note}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun historique." />
          )}
        </PanelSection>
      </CardContent>
    </Card>
  );
}

function PanelSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Boxes;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-forex-mint/20 bg-forex-mint/10 p-1.5 text-forex-mint">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs uppercase tracking-[0.18em] text-forex-muted">
          {title}
        </p>
      </div>
      {children}
    </section>
  );
}

function SupplierStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,22,37,0.98),rgba(15,24,40,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:p-4", className)}>
      <div className="flex items-start gap-2 text-forex-muted">
        <span className="rounded-full bg-white/[0.04] p-1.5">
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        </span>
        <span className="text-[11px] uppercase tracking-[0.14em] leading-4 text-forex-muted/90 break-words">
          {label}
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold tabular-nums leading-none text-white xl:text-xl">
        {value}
      </p>
    </div>
  );
}

function MetricLine({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-3 text-sm">
      <span className="text-forex-muted">{label}</span>
      <span className={cn("font-medium tabular-nums text-white", valueClassName)}>{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-forex-muted">
      {message}
    </p>
  );
}
