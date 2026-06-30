"use client";

import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpDown, CheckCircle2, Globe, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Currency = {
  code: string;
  name: string;
  flagCode: string;
  buyRate: number;
  sellRate: number;
};

const PRESETS = [
  { code: "USD", name: "Dollar américain", flagCode: "US" },
  { code: "EUR", name: "Euro", flagCode: "EU" },
  { code: "GBP", name: "Livre sterling", flagCode: "GB" },
  { code: "CAD", name: "Dollar canadien", flagCode: "CA" },
  { code: "CHF", name: "Franc suisse", flagCode: "CH" },
  { code: "XOF", name: "Franc CFA BCEAO", flagCode: "CI" }
];

export function CurrencyStudio({ initialCurrencies }: { initialCurrencies: Currency[] }) {
  const router = useRouter();
  const [currencies, setCurrencies] = useState(initialCurrencies);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    flagCode: "",
    buyRate: "",
    sellRate: ""
  });

  const filteredCurrencies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((currency) =>
      [currency.code, currency.name, currency.flagCode].some((value) => value.toLowerCase().includes(q))
    );
  }, [currencies, query]);

  const totals = useMemo(() => {
    const count = currencies.length;
    const spreadAvg = count
      ? currencies.reduce((sum, item) => sum + (item.sellRate - item.buyRate), 0) / count
      : 0;
    return { count, spreadAvg };
  }, [currencies]);

  function resetForm() {
    setForm({ code: "", name: "", flagCode: "", buyRate: "", sellRate: "" });
  }

  async function createCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      flagCode: form.flagCode.trim().toUpperCase(),
      buyRate: Number(form.buyRate),
      sellRate: Number(form.sellRate)
    };

    if (!payload.code || !payload.name || !payload.flagCode) {
      toast.error("Champs manquants", { description: "Remplis le code, le nom et le drapeau." });
      return;
    }

    if (!Number.isFinite(payload.buyRate) || !Number.isFinite(payload.sellRate)) {
      toast.error("Taux invalides", { description: "Entre deux valeurs numériques valides." });
      return;
    }

    const response = await fetch("/api/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast.error("Impossible d'ajouter", {
        description: error.error ?? "Vérifie les champs puis recommence."
      });
      return;
    }

    const created = await response.json();
    const nextCurrency = {
      ...created,
      buyRate: Number(created.buyRate),
      sellRate: Number(created.sellRate)
    } satisfies Currency;

    startTransition(() => {
      setCurrencies((current) => [nextCurrency, ...current.filter((item) => item.code !== nextCurrency.code)]);
      setShowForm(false);
      resetForm();
      router.refresh();
    });

    toast.success("Devise ajoutée", {
      description: `${nextCurrency.code} est maintenant disponible.`
    });
  }

  async function deleteCurrency(code: string) {
    if (!confirm(`Supprimer ${code} ?`)) return;

    setDeletingCode(code);
    try {
      const response = await fetch(`/api/currencies?code=${encodeURIComponent(code)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error("Suppression impossible", {
          description: error.error ?? "Cette devise est probablement liée à des données."
        });
        return;
      }

      startTransition(() => {
        setCurrencies((current) => current.filter((item) => item.code !== code));
        router.refresh();
      });

      toast.success("Devise supprimée", {
        description: `${code} a été retirée de la liste.`
      });
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-gradient text-slate-950">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-forex-muted">Currency Desk</p>
                <CardTitle className="text-2xl">Gestion des devises</CardTitle>
              </div>
            </div>
            <p className="max-w-2xl text-sm text-forex-muted">
              Ajoute, supprime et surveille les monnaies du bureau dans une interface réactive. Les changements
              sont envoyés directement à l'API, puis rafraîchis sans rechargement complet.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5">
              {totals.count} devises
            </Badge>
            <Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5">
              Spread moyen: {totals.spreadAvg.toFixed(2)} XAF
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpDown className="h-4 w-4 text-forex-mint" />
              Raccourcis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-forex-muted">
              Utilise les suggestions rapides pour accélérer l’ajout des devises courantes.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      code: preset.code,
                      name: preset.name,
                      flagCode: preset.flagCode
                    }));
                    setShowForm(true);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:border-forex-mint/40 hover:bg-white/[0.08]"
                >
                  {preset.code}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.24em] text-forex-muted">Recherche</p>
            <p className="text-sm text-forex-muted">
              Filtre par code, nom ou drapeau sans quitter la page.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="relative w-full md:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forex-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une devise..."
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowForm((current) => !current)} variant={showForm ? "secondary" : "default"}>
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? "Fermer" : "Nouvelle devise"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forex-mint" />
              Créer une devise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createCurrency} className="grid gap-4 lg:grid-cols-5">
              <Field label="Code">
                <Input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  maxLength={3}
                  placeholder="USD"
                  required
                />
              </Field>
              <Field label="Nom">
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Dollar américain"
                  required
                />
              </Field>
              <Field label="Drapeau">
                <Input
                  value={form.flagCode}
                  onChange={(event) => setForm((current) => ({ ...current, flagCode: event.target.value.toUpperCase() }))}
                  placeholder="US"
                  required
                />
              </Field>
              <Field label="Achat XAF">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.buyRate}
                  onChange={(event) => setForm((current) => ({ ...current, buyRate: event.target.value }))}
                  placeholder="600"
                  required
                />
              </Field>
              <Field label="Vente XAF">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellRate}
                  onChange={(event) => setForm((current) => ({ ...current, sellRate: event.target.value }))}
                  placeholder="615"
                  required
                />
              </Field>
              <div className="lg:col-span-5 flex flex-wrap justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Devises enregistrées</CardTitle>
            <p className="text-sm text-forex-muted">
              {filteredCurrencies.length} résultat{filteredCurrencies.length > 1 ? "s" : ""} affiché{filteredCurrencies.length > 1 ? "s" : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Drapeau</TableHead>
                  <TableHead>Achat</TableHead>
                  <TableHead>Vente</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCurrencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-forex-muted">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 opacity-30" />
                      Aucune devise ne correspond à la recherche.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <TableRow key={currency.code} className="transition hover:bg-white/[0.02]">
                      <TableCell className="font-semibold text-white">{currency.code}</TableCell>
                      <TableCell className="text-forex-muted">{currency.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-white">
                          {currency.flagCode}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-forex-mint">{currency.buyRate.toFixed(2)} XAF</TableCell>
                      <TableCell className="font-mono text-forex-danger">{currency.sellRate.toFixed(2)} XAF</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={deletingCode === currency.code}
                          onClick={() => deleteCurrency(currency.code)}
                        >
                          {deletingCode === currency.code ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.24em] text-forex-muted">{label}</Label>
      {children}
    </div>
  );
}
