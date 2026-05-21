"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Currency = { code: string; name: string };
type Supplier = { id: string; name: string };

export function StockMovementForm({ onCreated }: { onCreated: () => void }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [useCalculator, setUseCalculator] = useState(true);
  const [manualReceived, setManualReceived] = useState(false);

  const [formData, setFormData] = useState({
    currencyCode: "",
    direction: "IN" as "IN" | "OUT",
    amount: "",
    receivedAmount: "",
    reason: "SUPPLIER_PURCHASE" as "SUPPLIER_PURCHASE" | "ADJUSTMENT",
    supplierId: "",
    note: "",
    isDebt: false,
    totalCostXaf: "",
    unitPrice: ""
  });

  useEffect(() => {
    async function loadData() {
      const [resRates, resSuppliers] = await Promise.all([fetch("/api/rates"), fetch("/api/suppliers")]);

      if (resRates.ok) {
        const data = await resRates.json();
        setCurrencies(data.currencies);
        if (data.currencies.length > 0) {
          setFormData((prev) => ({ ...prev, currencyCode: data.currencies[0].code }));
        }
      }

      if (resSuppliers.ok) {
        const data = await resSuppliers.json();
        setSuppliers(data.suppliers);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (!manualReceived) {
      setFormData((prev) => ({ ...prev, receivedAmount: prev.amount }));
    }
  }, [formData.amount, manualReceived]);

  const isSupplierPurchase = formData.reason === "SUPPLIER_PURCHASE";

  useEffect(() => {
    if (useCalculator && formData.totalCostXaf && formData.unitPrice) {
      const total = Number(formData.totalCostXaf);
      const rate = Number(formData.unitPrice);
      if (!Number.isNaN(total) && !Number.isNaN(rate) && rate > 0) {
        setFormData((prev) => ({ ...prev, amount: (total / rate).toFixed(2) }));
      }
    }
  }, [formData.totalCostXaf, formData.unitPrice, useCalculator]);

  const remaining = useMemo(() => Number(formData.amount || 0) - Number(formData.receivedAmount || 0), [formData.amount, formData.receivedAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Montant invalide");
      return;
    }

    if (isSupplierPurchase && !formData.supplierId) {
      toast.error("Choisissez un fournisseur pour cet achat");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyCode: formData.currencyCode,
        direction: formData.direction,
        amount: Number(formData.receivedAmount || formData.amount),
        totalAmount: Number(formData.amount),
        supplierId: formData.supplierId || null,
        note: formData.note,
        reason: formData.reason,
        isDebt: formData.isDebt,
        unitPrice: formData.unitPrice ? Number(formData.unitPrice) : null,
        totalCostXaf: formData.totalCostXaf ? Number(formData.totalCostXaf) : null
      })
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'enregistrement");
      return;
    }

    toast.success("Mouvement de stock enregistre");
    setFormData((prev) => ({
      ...prev,
      amount: "",
      receivedAmount: "",
      note: "",
      totalCostXaf: "",
      unitPrice: "",
      isDebt: false
    }));
    setManualReceived(false);
    onCreated();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Nouvel approvisionnement / ajustement</CardTitle>
          <p className="mt-1 text-sm text-forex-muted">
            Les achats fournisseurs mettent a jour le prix moyen d'achat de la devise a partir des couts reels saisis.
          </p>
        </div>
        <Button type="button" variant={useCalculator ? "secondary" : "ghost"} size="sm" onClick={() => setUseCalculator((value) => !value)}>
          <Calculator className="mr-2 h-4 w-4" />
          {useCalculator ? "Masquer calcul" : "Calcul via XAF"}
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-3">
          <FieldSelect
            label="Devise"
            value={formData.currencyCode}
            onChange={(value) => setFormData({ ...formData, currencyCode: value })}
            options={currencies.map((currency) => ({ value: currency.code, label: `${currency.code} - ${currency.name}` }))}
          />

          <FieldSelect
            label="Direction"
            value={formData.direction}
            onChange={(value) => setFormData({ ...formData, direction: value as "IN" | "OUT" })}
            options={[
              { value: "IN", label: "ENTREE (Stock +)" },
              { value: "OUT", label: "SORTIE (Stock -)" }
            ]}
          />

          <FieldSelect
            label="Raison"
            value={formData.reason}
            onChange={(value) =>
              setFormData({
                ...formData,
                reason: value as "SUPPLIER_PURCHASE" | "ADJUSTMENT",
                direction: value === "SUPPLIER_PURCHASE" ? "IN" : formData.direction
              })
            }
            options={[
              { value: "SUPPLIER_PURCHASE", label: "Achat fournisseur" },
              { value: "ADJUSTMENT", label: "Ajustement de stock" }
            ]}
          />

          <FieldSelect
            label="Fournisseur"
            value={formData.supplierId}
            onChange={(value) => setFormData({ ...formData, supplierId: value })}
            options={[{ value: "", label: isSupplierPurchase ? "Selection requise" : "Aucun" }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]}
          />

          <div className="space-y-2">
            <Label>{useCalculator ? `Montant brut en XAF` : "Montant total en devise"}</Label>
            <Input
              type="number"
              step="0.01"
              value={useCalculator ? formData.totalCostXaf : formData.amount}
              onChange={(e) =>
                setFormData(
                  useCalculator
                    ? { ...formData, totalCostXaf: e.target.value }
                    : { ...formData, amount: e.target.value }
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{isSupplierPurchase ? "Prix d'achat unitaire" : "Montant recu reel"}</Label>
            <Input
              type="number"
              step="0.0001"
              value={isSupplierPurchase ? formData.unitPrice : formData.receivedAmount}
              onChange={(e) => {
                if (isSupplierPurchase) {
                  setFormData({ ...formData, unitPrice: e.target.value });
                  return;
                }
                setManualReceived(true);
                setFormData({ ...formData, receivedAmount: e.target.value });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Montant reel en devise</Label>
            <Input
              type="number"
              step="0.01"
              readOnly={useCalculator}
              className={useCalculator ? "bg-white/5 opacity-80" : ""}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {formData.supplierId ? (
            <div className="space-y-2 xl:col-span-2">
              <Label>Montant effectivement recu en stock</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.receivedAmount}
                onChange={(e) => {
                  setManualReceived(true);
                  setFormData({ ...formData, receivedAmount: e.target.value });
                }}
              />
            </div>
          ) : null}

          <div className="space-y-2 xl:col-span-3">
            <Label>Note / reference</Label>
            <Input value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Ex: facture, accord, precision fournisseur" />
          </div>

          {formData.supplierId && remaining > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-400/10 p-3 text-sm text-amber-300 xl:col-span-3">
              <AlertCircle className="h-4 w-4" />
              <span>
                Ecart detecte: le fournisseur vous doit encore <strong>{remaining.toFixed(2)} {formData.currencyCode}</strong>. La dette sera mise a jour automatiquement.
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-3 xl:col-span-3">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-lg border-white/10 bg-[#0F1625] text-forex-mint focus:ring-forex-mint"
                checked={formData.isDebt}
                onChange={(e) => setFormData({ ...formData, isDebt: e.target.checked })}
              />
              Reglement de dette fournisseur
            </label>
          </div>

          <div className="xl:col-span-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer le mouvement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="w-full rounded-2xl border border-white/10 bg-[#0F1625] px-3 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-forex-mint"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || "empty"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
