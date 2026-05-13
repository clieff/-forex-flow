"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, AlertCircle } from "lucide-react";

type Currency = { code: string; name: string };
type Supplier = { id: string; name: string };

export function StockMovementForm({ onCreated }: { onCreated: () => void }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [useCalculator, setUseCalculator] = useState(false);
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
    amountXAF: "",
    exchangeRate: ""
  });

  useEffect(() => {
    async function loadData() {
      const [resRates, resSuppliers] = await Promise.all([
        fetch("/api/rates"),
        fetch("/api/suppliers")
      ]);
      
      if (resRates.ok) {
        const data = await resRates.json();
        setCurrencies(data.currencies);
        if (data.currencies.length > 0) {
          setFormData(prev => ({ ...prev, currencyCode: data.currencies[0].code }));
        }
      }
      
      if (resSuppliers.ok) {
        const data = await resSuppliers.json();
        setSuppliers(data.suppliers);
      }
    }
    void loadData();
  }, []);

  // Sync receivedAmount with amount if not manual
  useEffect(() => {
    if (!manualReceived) {
      setFormData(prev => ({ ...prev, receivedAmount: prev.amount }));
    }
  }, [formData.amount, manualReceived]);

  // Calcul automatique du montant final (CFA -> Devise)
  useEffect(() => {
    if (useCalculator && formData.amountXAF && formData.exchangeRate) {
      const xaf = parseFloat(formData.amountXAF);
      const rate = parseFloat(formData.exchangeRate);
      if (!isNaN(xaf) && !isNaN(rate) && rate > 0) {
        const finalAmount = (xaf / rate).toFixed(2);
        setFormData(prev => ({ ...prev, amount: finalAmount }));
      }
    }
  }, [formData.amountXAF, formData.exchangeRate, useCalculator]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Montant invalide");
      return;
    }

    const total = Number(formData.amount);
    const received = Number(formData.receivedAmount || formData.amount);

    setLoading(true);
    const res = await fetch("/api/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        amount: received, // Le stock réel augmente de ce qu'on a perçu
        totalAmount: total, // On envoie le total pour que le backend calcule la dette
        supplierId: formData.supplierId || null
      })
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'enregistrement");
      return;
    }

    toast.success("Mouvement de stock enregistré");
    setFormData(prev => ({ 
      ...prev, 
      amount: "", 
      receivedAmount: "", 
      amountXAF: "", 
      exchangeRate: "", 
      note: "" 
    }));
    setManualReceived(false);
    onCreated();
  }

  const remaining = Number(formData.amount || 0) - Number(formData.receivedAmount || 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Nouvel Approvisionnement / Ajustement</CardTitle>
        <Button 
          type="button" 
          variant={useCalculator ? "secondary" : "outline"} 
          size="sm"
          onClick={() => setUseCalculator(!useCalculator)}
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          {useCalculator ? "Masquer calcul" : "Calculer via CFA"}
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Devise</Label>
            <select
              className="w-full rounded-md border border-white/10 bg-[#0F1625] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-forex-mint"
              value={formData.currencyCode}
              onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
            >
              <option value="" disabled>Sélectionner une devise</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <select
              className="w-full rounded-md border border-white/10 bg-[#0F1625] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-forex-mint"
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value as "IN" | "OUT" })}
            >
              <option value="IN">ENTRÉE (Stock +)</option>
              <option value="OUT">SORTIE (Stock -)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Raison</Label>
            <select
              className="w-full rounded-md border border-white/10 bg-[#0F1625] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-forex-mint"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
            >
              <option value="SUPPLIER_PURCHASE">Achat fournisseur</option>
              <option value="ADJUSTMENT">Ajustement de caisse</option>
            </select>
          </div>

          {useCalculator && (
            <>
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label className="text-forex-mint">Montant en CFA (XAF)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 655957"
                  className="border-forex-mint/30 focus:ring-forex-mint"
                  value={formData.amountXAF}
                  onChange={(e) => setFormData({ ...formData, amountXAF: e.target.value })}
                />
              </div>

              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label className="text-forex-mint">Taux d'acquisition</Label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Ex: 655.957"
                  className="border-forex-mint/30 focus:ring-forex-mint"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{useCalculator ? `Total à recevoir (${formData.currencyCode})` : "Montant total"}</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              readOnly={useCalculator}
              className={useCalculator ? "bg-white/5 opacity-80" : ""}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {formData.supplierId && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label className="text-amber-400">Montant réellement perçu</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="border-amber-400/30 focus:ring-amber-400"
                value={formData.receivedAmount}
                onChange={(e) => {
                  setManualReceived(true);
                  setFormData({ ...formData, receivedAmount: e.target.value });
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Fournisseur (Optionnel)</Label>
            <select
              className="w-full rounded-md border border-white/10 bg-[#0F1625] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-forex-mint"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">— Aucun —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Note / Référence</Label>
            <Input
              placeholder="Ex: Facture #123"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          {formData.supplierId && remaining > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-400 sm:col-span-2 lg:col-span-3">
              <AlertCircle className="h-4 w-4" />
              <span>
                Le fournisseur vous devra <strong>{remaining.toFixed(2)} {formData.currencyCode}</strong>. 
                Ce montant sera ajouté à sa dette.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-lg border-white/10 bg-[#0F1625] text-forex-mint focus:ring-forex-mint"
                checked={formData.isDebt}
                onChange={(e) => setFormData({ ...formData, isDebt: e.target.checked })}
              />
              <span className="text-sm text-white group-hover:text-forex-mint transition">Marquer comme Règlement de Dette (Le fournisseur vous rend ce qu'il vous doit)</span>
            </label>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer le mouvement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
