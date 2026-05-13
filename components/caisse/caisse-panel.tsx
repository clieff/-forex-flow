"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  direction: z.enum(["IN", "OUT"]),
  amount: z.number().positive("Montant invalide"),
  reason: z.enum(["DEPOT", "RETRAIT", "DEPENSE", "AJUSTEMENT", "AUTRE"]),
  note: z.string().max(200).optional().or(z.literal(""))
});

type FormValues = z.infer<typeof schema>;

const REASONS = [
  { value: "DEPOT", label: "Dépôt de fonds" },
  { value: "RETRAIT", label: "Retrait de fonds" },
  { value: "DEPENSE", label: "Dépense opérationnelle" },
  { value: "AJUSTEMENT", label: "Ajustement de caisse" },
  { value: "AUTRE", label: "Autre" }
] as const;

export function CaissePanel() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      direction: "IN",
      amount: 0,
      reason: "DEPOT",
      note: ""
    }
  });

  async function onSubmit(data: FormValues) {
    const res = await fetch("/api/caisse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      toast.error("Erreur", { description: "Mouvement non enregistré." });
      return;
    }

    toast.success("Mouvement enregistré", {
      description: `${data.direction === "IN" ? "Entrée" : "Sortie"} de ${data.amount.toLocaleString("fr-FR")} XAF.`
    });
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-premium text-forex-muted">Gestion manuelle</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Mouvement de caisse</h3>
        </div>
        <Button onClick={() => setOpen(!open)} variant={open ? "secondary" : "default"} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {open ? "Annuler" : "Nouveau mouvement"}
        </Button>
      </div>

      {open && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 border-t border-white/10 pt-6">
          {/* Type de mouvement */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => form.setValue("direction", "IN")}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                form.watch("direction") === "IN"
                  ? "border-forex-mint/40 bg-forex-mint/10 text-forex-mint"
                  : "border-white/10 bg-white/[0.03] text-forex-muted hover:border-white/20"
              }`}
            >
              <ArrowDownLeft className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">Entrée</p>
                <p className="text-xs opacity-70">Fonds reçus</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => form.setValue("direction", "OUT")}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                form.watch("direction") === "OUT"
                  ? "border-forex-danger/40 bg-forex-danger/10 text-forex-danger"
                  : "border-white/10 bg-white/[0.03] text-forex-muted hover:border-white/20"
              }`}
            >
              <ArrowUpRight className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm font-semibold">Sortie</p>
                <p className="text-xs opacity-70">Fonds décaissés</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant (XAF)</Label>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    type="number"
                    step="1"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-forex-danger">{form.formState.errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motif</Label>
              <Controller
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <select
                    {...field}
                    className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note (optionnel)</Label>
            <Controller
              control={form.control}
              name="note"
              render={({ field }) => (
                <Input placeholder="Précisez si nécessaire..." value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
          </div>

          <Button size="lg" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enregistrer le mouvement
          </Button>
        </form>
      )}
    </div>
  );
}
