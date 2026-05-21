"use client";

import { useEffect, useState } from "react";
import { ArrowDownUp, BadgeDollarSign, Boxes, Clock3, PlusCircle, TrendingUp } from "lucide-react";
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
      body: JSON.stringify({ name, contact })
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
        <h3 className="mb-4 text-lg font-semibold text-white">Nouveau fournisseur</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Nom fournisseur" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Contact (optionnel)" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Button onClick={createSupplier} disabled={loading}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
        {items.length === 0 ? <p className="text-sm text-forex-muted">Aucun fournisseur pour le moment.</p> : null}
      </div>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierDto }) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="gap-4 border-b border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-xl text-white">{supplier.name}</CardTitle>
            <p className="mt-1 text-sm text-forex-muted">{supplier.contact || "Aucun contact renseigne"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <p className="text-xs uppercase tracking-premium text-forex-muted">Dernier mouvement</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {supplier.summary.lastMovementAt
                ? new Date(supplier.summary.lastMovementAt).toLocaleDateString("fr-FR")
                : "Aucun"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SupplierStat icon={ArrowDownUp} label="Mouvements" value={String(supplier.summary.totalMovements)} />
          <SupplierStat icon={BadgeDollarSign} label="Solde global dette" value={supplier.summary.outstandingDebt.toFixed(2)} />
          <SupplierStat icon={Clock3} label="Devises ouvertes" value={String(supplier.summary.totalDebtCurrencies)} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-forex-mint" />
            <p className="text-xs uppercase tracking-premium text-forex-muted">Soldes et prix par devise</p>
          </div>

          {supplier.positions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {supplier.positions.map((position) => (
                <div key={position.currencyCode} className="rounded-2xl border border-white/10 bg-[#0F1625] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{position.currencyCode}</p>
                    <TrendingUp className="h-4 w-4 text-forex-mint" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-forex-muted">Stock: <span className="font-semibold text-white">{position.stockBalance.toFixed(2)}</span></p>
                    <p className={cn("text-forex-muted", position.debtBalance < 0 ? "text-emerald-300" : position.debtBalance > 0 ? "text-red-300" : "")}>
                      Dette: <span className="font-semibold">{position.debtBalance.toFixed(2)}</span>
                    </p>
                    <p className="text-forex-muted">Achete: {position.totalPurchased.toFixed(2)} · Sorti: {position.totalSold.toFixed(2)}</p>
                    <p className="text-forex-muted">
                      Prix moyen: <span className="text-white">{position.averageBuyRate?.toFixed(4) ?? "-"}</span>
                    </p>
                    <p className="text-forex-muted">
                      Dernier prix: <span className="text-white">{position.lastBuyRate?.toFixed(4) ?? "-"}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-forex-muted">
              Aucun mouvement rattache a ce fournisseur.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4 text-forex-mint" />
            <p className="text-xs uppercase tracking-premium text-forex-muted">Dettes par devise</p>
          </div>

          {supplier.debts.length > 0 ? (
            supplier.debts.map((debt) => (
              <div key={debt.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{debt.currencyCode}</p>
                  <p className="text-xs text-forex-muted">
                    Mise a jour {new Date(debt.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <span className={cn("font-semibold", debt.amount < 0 ? "text-emerald-300" : debt.amount > 0 ? "text-red-300" : "text-white")}>
                  {debt.amount.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-forex-muted">
              Aucune dette active.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-premium text-forex-muted">Historique detaille du fournisseur</p>
          {supplier.recentMovements.length > 0 ? (
            supplier.recentMovements.map((movement) => (
              <div key={movement.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {movement.direction === "IN" ? "Entree" : "Sortie"} {movement.currencyCode} · {movement.reason}
                    </p>
                    <p className="text-xs text-forex-muted">
                      {new Date(movement.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · Agent {movement.createdBy}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-white">{movement.amount.toFixed(2)}</p>
                    <p className="text-xs text-forex-mint">
                      {movement.unitPrice ? `${movement.unitPrice.toFixed(4)} XAF` : "Sans prix d'achat"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-forex-muted">
                  <span>Total cout: {movement.totalCostXaf?.toFixed(2) ?? "-"}</span>
                  <span>Client: {movement.clientName || "N/A"}</span>
                  <span>Recu: {movement.receiptNumber || "N/A"}</span>
                  {movement.note ? <span>Note: {movement.note}</span> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-forex-muted">
              Aucun historique disponible pour ce fournisseur.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierStat({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-forex-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-premium">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
