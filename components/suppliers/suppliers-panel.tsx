"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  BadgeDollarSign,
  Boxes,
  Clock3,
  PlusCircle,
  TrendingUp,
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
    <div className="space-y-6">
      <div className="panel p-4 md:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Nouveau fournisseur
        </h3>
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="Nom fournisseur"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-2xl border-forex-border bg-white/5"
          />
          <Input
            placeholder="Contact (optionnel)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="h-12 rounded-2xl border-forex-border bg-white/5"
          />
          <Button
            onClick={createSupplier}
            disabled={loading}
            size="lg"
            className="h-12"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-forex-muted">
            Aucun fournisseur pour le moment.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierDto }) {
  return (
    <Card className="w-full border-white/10 bg-white/5">
      <CardHeader className="gap-4 border-b border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg lg:text-xl text-white truncate break-words">
              {supplier.name}
            </CardTitle>
            <p className="mt-1 text-sm text-forex-muted truncate break-words">
              {supplier.contact || "Aucun contact renseigne"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 lg:px-4 py-2 whitespace-nowrap flex-shrink-0">
            <p className="text-xs uppercase tracking-premium text-forex-muted">
              Dernier
            </p>
            <p className="mt-1 text-xs lg:text-sm font-semibold text-white">
              {supplier.summary.lastMovementAt
                ? new Date(supplier.summary.lastMovementAt).toLocaleDateString(
                    "fr-FR",
                    { year: "2-digit", month: "2-digit", day: "2-digit" },
                  )
                : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-2 grid-cols-3">
          <SupplierStat
            icon={ArrowDownUp}
            label="Mvts"
            value={String(supplier.summary.totalMovements)}
          />
          <SupplierStat
            icon={BadgeDollarSign}
            label="Dette"
            value={supplier.summary.outstandingDebt.toFixed(2)}
          />
          <SupplierStat
            icon={Clock3}
            label="Devises"
            value={String(supplier.summary.totalDebtCurrencies)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 lg:p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-forex-mint flex-shrink-0" />
            <p className="text-xs uppercase tracking-premium text-forex-muted">
              Soldes par devise
            </p>
          </div>

          {supplier.positions.length > 0 ? (
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {supplier.positions.map((position) => (
                <div
                  key={position.currencyCode}
                  className="rounded-xl lg:rounded-2xl border border-white/10 bg-[#0F1625] p-3 min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white text-sm">
                      {position.currencyCode}
                    </p>
                    <TrendingUp className="h-3 w-3 text-forex-mint flex-shrink-0" />
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-forex-muted">
                      Stock:{" "}
                      <span className="text-white">
                        {position.stockBalance.toFixed(2)}
                      </span>
                    </p>
                    <p
                      className={cn(
                        "text-forex-muted",
                        position.debtBalance < 0
                          ? "text-emerald-300"
                          : position.debtBalance > 0
                            ? "text-red-300"
                            : "",
                      )}
                    >
                      Dette: <span>{position.debtBalance.toFixed(2)}</span>
                    </p>
                    <p className="text-forex-muted">
                      PMA:{" "}
                      <span className="text-white">
                        {position.averageBuyRate?.toFixed(4) ?? "-"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-forex-muted">
              Aucun mouvement.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4 text-forex-mint flex-shrink-0" />
            <p className="text-xs uppercase tracking-premium text-forex-muted">
              Dettes actives
            </p>
          </div>

          {supplier.debts.length > 0 ? (
            <div className="space-y-2">
              {supplier.debts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 min-w-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {debt.currencyCode}
                    </p>
                    <p className="text-xs text-forex-muted">
                      {new Date(debt.updatedAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-semibold text-sm flex-shrink-0",
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
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-forex-muted">
              Aucune dette active.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-premium text-forex-muted">
            Historique recents
          </p>
          {supplier.recentMovements.length > 0 ? (
            supplier.recentMovements.map((movement) => (
              <div
                key={movement.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 min-w-0"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm whitespace-normal break-words">
                      {movement.direction === "IN" ? "Entree" : "Sortie"}{" "}
                      {movement.currencyCode} · {movement.reason}
                    </p>
                    <p className="text-xs text-forex-muted">
                      {new Date(movement.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}{" "}
                      · {movement.createdBy}
                    </p>
                  </div>
                  <div className="text-left md:text-right flex-shrink-0">
                    <p className="font-semibold text-white text-sm">
                      {movement.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-forex-mint">
                      {movement.unitPrice
                        ? `${movement.unitPrice.toFixed(4)}`
                        : "-"}
                    </p>
                  </div>
                </div>
                {(movement.totalCostXaf ||
                  movement.clientName ||
                  movement.receiptNumber ||
                  movement.note) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-forex-muted border-t border-white/5 pt-2">
                    {movement.totalCostXaf && (
                      <span>Cout: {movement.totalCostXaf?.toFixed(2)}</span>
                    )}
                    {movement.clientName && (
                      <span>Client: {movement.clientName}</span>
                    )}
                    {movement.receiptNumber && (
                      <span>#{movement.receiptNumber}</span>
                    )}
                    {movement.note ? <span>Note: {movement.note}</span> : null}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-forex-muted">
              Aucun historique.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl lg:rounded-2xl border border-white/10 bg-white/[0.03] p-2 lg:p-3">
      <div className="flex items-center gap-2 text-forex-muted">
        <Icon className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
        <span className="text-xs uppercase tracking-premium truncate">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xs lg:text-sm font-semibold text-white truncate">
        {value}
      </p>
    </div>
  );
}
