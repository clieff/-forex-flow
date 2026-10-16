"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentAccount = {
  id: string;
  name: string;
  kind: "CASH" | "MOBILE_MONEY" | "BANK" | "OTHER";
};

const movementSchema = z.object({
  direction: z.enum(["IN", "OUT"]),
  amount: z.number().positive(),
  paymentAccountId: z.string().min(1),
  reason: z.enum(["DEPOT", "RETRAIT", "DEPENSE", "AJUSTEMENT", "AUTRE"]),
  note: z.string().max(200)
});

const accountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  kind: z.enum(["CASH", "MOBILE_MONEY", "BANK", "OTHER"])
});

const reasons = [
  { value: "DEPOT", label: "Dépôt" },
  { value: "RETRAIT", label: "Retrait" },
  { value: "DEPENSE", label: "Dépense" },
  { value: "AJUSTEMENT", label: "Ajustement" },
  { value: "AUTRE", label: "Autre" }
];

export function CaissePanel({ accounts, canManageAccounts }: { accounts: PaymentAccount[]; canManageAccounts: boolean }) {
  const [isMovementOpen, setMovementOpen] = useState(false);
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [movement, setMovement] = useState({
    direction: "IN" as "IN" | "OUT",
    amount: "",
    paymentAccountId: accounts.find((account) => account.kind === "CASH")?.id ?? accounts[0]?.id ?? "",
    reason: "DEPOT",
    note: ""
  });
  const [account, setAccount] = useState({ name: "", kind: "MOBILE_MONEY" as PaymentAccount["kind"] });
  const router = useRouter();

  async function submitMovement(event: React.FormEvent) {
    event.preventDefault();
    const parsed = movementSchema.safeParse({ ...movement, amount: Number(movement.amount) });
    if (!parsed.success) {
      toast.error("Complète le montant et le compte de caisse.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/caisse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      if (!response.ok) throw new Error();
      toast.success("Mouvement enregistré.");
      setMovementOpen(false);
      setMovement((current) => ({ ...current, amount: "", note: "" }));
      router.refresh();
    } catch {
      toast.error("Le mouvement n'a pas pu être enregistré.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAccount(event: React.FormEvent) {
    event.preventDefault();
    const parsed = accountSchema.safeParse(account);
    if (!parsed.success) {
      toast.error("Indique un nom de compte valide.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/payment-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      if (!response.ok) throw new Error();
      toast.success("Moyen de paiement ajouté.");
      setAccountOpen(false);
      setAccount({ name: "", kind: "MOBILE_MONEY" });
      router.refresh();
    } catch {
      toast.error("Ce moyen de paiement existe déjà ou est invalide.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-premium text-forex-muted">Ma caisse</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Mouvement manuel</h3>
        </div>
        <div className="flex gap-2">
          {canManageAccounts && (
            <Button type="button" variant="secondary" size="sm" onClick={() => setAccountOpen((open) => !open)}>
              <Plus className="mr-2 h-4 w-4" /> Compte
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => setMovementOpen((open) => !open)}>
            <Plus className="mr-2 h-4 w-4" /> Mouvement
          </Button>
        </div>
      </div>

      {isMovementOpen && (
        <form onSubmit={submitMovement} className="mt-6 space-y-4 border-t border-white/10 pt-5">
          <div className="grid grid-cols-2 gap-3">
            {(["IN", "OUT"] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => setMovement((current) => ({ ...current, direction }))}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  movement.direction === direction
                    ? direction === "IN" ? "border-forex-mint/40 bg-forex-mint/10 text-forex-mint" : "border-forex-danger/40 bg-forex-danger/10 text-forex-danger"
                    : "border-white/10 text-forex-muted"
                }`}
              >
                {direction === "IN" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                {direction === "IN" ? "Entrée" : "Sortie"}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Montant (XAF)</Label>
              <Input type="number" min="1" value={movement.amount} onChange={(event) => setMovement({ ...movement, amount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Compte</Label>
              <select value={movement.paymentAccountId} onChange={(event) => setMovement({ ...movement, paymentAccountId: event.target.value })} className="flex h-12 w-full rounded-lg border border-forex-border bg-white/5 px-3 text-sm text-forex-text">
                {accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <select value={movement.reason} onChange={(event) => setMovement({ ...movement, reason: event.target.value })} className="flex h-12 w-full rounded-lg border border-forex-border bg-white/5 px-3 text-sm text-forex-text">
                {reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input value={movement.note} onChange={(event) => setMovement({ ...movement, note: event.target.value })} placeholder="Facultatif" />
            </div>
          </div>
          <Button disabled={isSubmitting || accounts.length === 0} className="w-full">
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
          </Button>
        </form>
      )}

      {isAccountOpen && (
        <form onSubmit={submitAccount} className="mt-6 space-y-4 border-t border-white/10 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Nom</Label><Input value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} placeholder="Orange Money" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={account.kind} onChange={(event) => setAccount({ ...account, kind: event.target.value as PaymentAccount["kind"] })} className="flex h-12 w-full rounded-lg border border-forex-border bg-white/5 px-3 text-sm text-forex-text">
                <option value="MOBILE_MONEY">Mobile Money</option><option value="CASH">Espèces</option><option value="BANK">Banque</option><option value="OTHER">Autre</option>
              </select>
            </div>
          </div>
          <Button disabled={isSubmitting} className="w-full">{isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />} Ajouter le compte</Button>
        </form>
      )}
    </section>
  );
}
