"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  currencies: string[];
  currentFilters: {
    type?: string;
    currency?: string;
    from?: string;
    to?: string;
    q?: string;
  };
}

export function TransactionFilters({ currencies, currentFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      const current = { ...currentFilters, [key]: value };
      Object.entries(current).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.delete("page");
      router.push(`${pathname}?${params.toString()}` as any);
    },
    [currentFilters, pathname, router]
  );

  const clearFilters = () => {
    router.push(pathname as any);
  };

  const hasFilters = Object.values(currentFilters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* Recherche */}
        <div className="space-y-1 xl:col-span-2">
          <Label>Recherche</Label>
          <Input
            placeholder="Client, n° de reçu..."
            defaultValue={currentFilters.q ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => updateFilter("q", val), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label>Type</Label>
          <select
            value={currentFilters.type ?? ""}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
          >
            <option value="">Tous</option>
            <option value="BUY">Achat</option>
            <option value="SELL">Vente</option>
          </select>
        </div>

        {/* Devise */}
        <div className="space-y-1">
          <Label>Devise</Label>
          <select
            value={currentFilters.currency ?? ""}
            onChange={(e) => updateFilter("currency", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
          >
            <option value="">Toutes</option>
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label>De</Label>
          <Input
            type="date"
            defaultValue={currentFilters.from ?? ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <Label>À</Label>
          <Input
            type="date"
            defaultValue={currentFilters.to ?? ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="h-12 max-w-[200px]"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-forex-muted transition hover:border-forex-danger/30 hover:text-forex-danger"
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  );
}
