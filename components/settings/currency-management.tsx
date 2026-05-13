"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LoaderCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Currency = {
  code: string;
  name: string;
  flagCode: string;
  buyRate: number;
  sellRate: number;
};

const SUGGESTIONS = [
  { code: "GBP", name: "Livre Sterling", flagCode: "GB" },
  { code: "CAD", name: "Dollar Canadien", flagCode: "CA" },
  { code: "CHF", name: "Franc Suisse", flagCode: "CH" },
  { code: "CNY", name: "Yuan Chinois", flagCode: "CN" },
  { code: "JPY", name: "Yen Japonais", flagCode: "JP" },
  { code: "NGN", name: "Naira Nigérian", flagCode: "NG" },
  { code: "ZAR", name: "Rand Sud-Africain", flagCode: "ZA" },
  { code: "AED", name: "Dirham des EAU", flagCode: "AE" },
];

export function CurrencyManagement({ initialCurrencies }: { initialCurrencies: Currency[] }) {
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    flagCode: "",
    buyRate: 0,
    sellRate: 0,
  });

  async function handleAddCurrency(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error("Erreur", { description: error.error || "Impossible d'ajouter la devise." });
        return;
      }

      const newCurrency = await res.json();
      // Ensure numeric rates for display
      const formattedCurrency = {
        ...newCurrency,
        buyRate: Number(newCurrency.buyRate),
        sellRate: Number(newCurrency.sellRate)
      };
      
      setCurrencies([...currencies, formattedCurrency]);
      setIsAdding(false);
      setFormData({ code: "", name: "", flagCode: "", buyRate: 0, sellRate: 0 });
      toast.success("Devise ajoutée", { description: `${newCurrency.code} est maintenant disponible.` });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-forex-muted">Configuration des monnaies acceptées au desk.</p>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? "Annuler" : "Ajouter une devise"}
        </Button>
      </div>

      {isAdding && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-premium text-forex-muted mb-4 flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Suggestions rapides
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setFormData({ ...formData, code: s.code, name: s.name, flagCode: s.flagCode })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-forex-mint/50 hover:bg-white/10"
                >
                  {s.code} - {s.name}
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={handleAddCurrency} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Code (ex: CAD)</Label>
                <Input 
                  required 
                  maxLength={3} 
                  value={formData.code} 
                  placeholder="USD"
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                />
              </div>
              <div className="space-y-1">
                <Label>Nom (ex: Dollar Canadien)</Label>
                <Input 
                  required 
                  value={formData.name} 
                  placeholder="Dollar US"
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <Label>Code Drapeau (ex: CA, US, GB)</Label>
                <Input 
                  required 
                  maxLength={2} 
                  value={formData.flagCode} 
                  placeholder="US"
                  onChange={e => setFormData({ ...formData, flagCode: e.target.value.toUpperCase() })} 
                />
              </div>
              <div className="space-y-1">
                <Label>Taux Achat initial (XAF)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.buyRate || ""} 
                  onChange={e => setFormData({ ...formData, buyRate: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div className="space-y-1">
                <Label>Taux Vente initial (XAF)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.sellRate || ""} 
                  onChange={e => setFormData({ ...formData, sellRate: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enregistrer la devise
            </Button>
          </form>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Devise</TableHead>
            <TableHead className="text-center">Drapeau</TableHead>
            <TableHead>Achat</TableHead>
            <TableHead>Vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-forex-muted">
                Aucune devise configurée.
              </TableCell>
            </TableRow>
          ) : (
            currencies.map((curr) => (
              <TableRow key={curr.code}>
                <TableCell>
                  <p className="font-semibold text-white">{curr.code}</p>
                  <p className="text-sm text-forex-muted">{curr.name}</p>
                </TableCell>
                <TableCell className="text-center">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-lg">
                    {curr.flagCode}
                  </div>
                </TableCell>
                <TableCell className="text-forex-mint font-mono font-semibold">{curr.buyRate.toFixed(2)} XAF</TableCell>
                <TableCell className="text-forex-danger font-mono font-semibold">{curr.sellRate.toFixed(2)} XAF</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
