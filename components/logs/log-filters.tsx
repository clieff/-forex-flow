"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogCategory } from "@prisma/client";

interface Props {
  currentFilters: {
    category?: string;
    from?: string;
    to?: string;
    q?: string;
  };
}

export function LogFilters({ currentFilters }: Props) {
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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recherche */}
        <div className="space-y-1">
          <Label>Recherche</Label>
          <Input
            placeholder="Action, détails, utilisateur..."
            defaultValue={currentFilters.q ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const timeout = setTimeout(() => updateFilter("q", val), 400);
              return () => clearTimeout(timeout);
            }}
          />
        </div>

        {/* Catégorie */}
        <div className="space-y-1">
          <Label>Catégorie</Label>
          <select
            value={currentFilters.category ?? ""}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-forex-border bg-[#0d1523]/80 px-4 text-sm text-forex-text outline-none"
          >
            <option value="">Toutes</option>
            {Object.values(LogCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date De */}
        <div className="space-y-1">
          <Label>De</Label>
          <Input
            type="date"
            defaultValue={currentFilters.from ?? ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="h-12"
          />
        </div>

        {/* Date À */}
        <div className="space-y-1">
          <Label>À</Label>
          <Input
            type="date"
            defaultValue={currentFilters.to ?? ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-forex-muted transition hover:border-forex-danger/30 hover:text-forex-danger"
          >
            Effacer les filtres
          </button>
        </div>
      )}
    </div>
  );
}
