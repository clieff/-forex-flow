"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Supplier = { id: string; name: string; contact: string | null; createdAt: string };

export function SuppliersPanel() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/suppliers");
    if (!res.ok) {
      toast.error("Impossible de charger les fournisseurs");
      return;
    }
    const data = (await res.json()) as { suppliers: Supplier[] };
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

  async function removeSupplier(id: string) {
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression refusee");
      return;
    }
    toast.success("Fournisseur supprime");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Nom fournisseur" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Contact (optionnel)" value={contact} onChange={(e) => setContact(e.target.value)} />
        <Button onClick={createSupplier} disabled={loading}>
          Ajouter
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{s.name}</p>
              <p className="truncate text-sm text-forex-muted">{s.contact ?? "—"}</p>
            </div>
            <Button variant="secondary" onClick={() => removeSupplier(s.id)}>
              Supprimer
            </Button>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-forex-muted">Aucun fournisseur pour le moment.</p> : null}
      </div>
    </div>
  );
}

