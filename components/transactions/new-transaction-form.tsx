"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, ReceiptText, Sparkles, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ReceiptPreview } from "@/components/transactions/receipt-preview";
import type { CurrencyDto } from "@/types/dto";

type RegularClient = {
  id: string;
  name: string;
  fixedRates: Array<{
    currencyCode: string;
    buyRate: number | null;
    sellRate: number | null;
  }>;
};

type TransactionFormValues = {
  type: "BUY" | "SELL";
  currencyCode: string;
  amountGiven: number;
  clientName?: string;
  clientId?: string;
  supplierId?: string;
  isDebt?: boolean;
};

export function NewTransactionForm({ 
  currencies, 
  clients = [],
  suppliers = [],
  stockBalances = []
}: { 
  currencies: CurrencyDto[];
  clients?: RegularClient[];
  suppliers?: { id: string; name: string }[];
  stockBalances?: any[];
}) {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isRegular, setIsRegular] = useState(false);
  const router = useRouter();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "BUY",
      currencyCode: currencies[0]?.code ?? "USD",
      amountGiven: 100,
      clientName: "",
      clientId: "",
      supplierId: "GENERAL",
      isDebt: false
    }
  });

  const values = form.watch();
  const selectedCurrency = currencies.find((currency) => currency.code === values.currencyCode);
  const selectedClient = clients.find(c => c.id === values.clientId);

  const currentStock = useMemo(() => {
    if (!values.currencyCode) return 0;
    const balance = stockBalances.find(b => b.code === values.currencyCode);
    if (!balance) return 0;
    
    if (!values.supplierId || values.supplierId === "GENERAL") {
      return Number(balance.balance);
    }
    
    const supplierStock = balance.suppliers.find((s: any) => s.id === values.supplierId);
    return supplierStock ? Number(supplierStock.balance) : 0;
  }, [values.supplierId, values.currencyCode, stockBalances]);

  const currentDebt = useMemo(() => {
    if (!values.supplierId || values.supplierId === "GENERAL" || !values.currencyCode) return 0;
    const balance = stockBalances.find(b => b.code === values.currencyCode);
    if (!balance) return 0;
    const supplierStock = balance.suppliers.find((s: any) => s.id === values.supplierId);
    return supplierStock ? Number(supplierStock.debt || 0) : 0;
  }, [values.supplierId, values.currencyCode, stockBalances]);

  const currentDebtLabel =
    currentDebt < 0
      ? `Le fournisseur vous doit ${Math.abs(currentDebt).toLocaleString()} ${values.currencyCode}`
      : currentDebt > 0
        ? `Vous devez ${currentDebt.toLocaleString()} ${values.currencyCode} au fournisseur`
        : "Aucune dette en cours";

  const computed = useMemo(() => {
    if (!selectedCurrency || !values.amountGiven) {
      return { amountReceived: 0, rate: 0 };
    }

    let rate = values.type === "BUY" ? selectedCurrency.buyRate : selectedCurrency.sellRate;

    // Use fixed client rate if available
    if (isRegular && selectedClient) {
      const fixed = selectedClient.fixedRates.find(r => r.currencyCode === values.currencyCode);
      if (fixed) {
        if (values.type === "BUY" && fixed.buyRate) {
          rate = fixed.buyRate;
        } else if (values.type === "SELL" && fixed.sellRate) {
          rate = fixed.sellRate;
        }
      }
    }

    if (values.type === "BUY") {
      return {
        amountReceived: Number((values.amountGiven * rate).toFixed(2)),
        rate
      };
    }

    return {
      amountReceived: Number((values.amountGiven / rate).toFixed(2)),
      rate
    };
  }, [selectedCurrency, values.amountGiven, values.type, isRegular, selectedClient, values.currencyCode]);

  async function onSubmit(payload: TransactionFormValues) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        supplierId: payload.supplierId === "GENERAL" ? undefined : payload.supplierId,
        clientName: isRegular ? selectedClient?.name : payload.clientName,
        clientId: isRegular ? payload.clientId : undefined
      })
    });

    if (!response.ok) {
      toast.error("Transaction refusee", {
        description: "Verifier les valeurs puis recommencez."
      });
      return;
    }

    const data = (await response.json()) as { id: string };
    setTransactionId(data.id);
    toast.success("Transaction enregistree", {
      description: "Le recu PDF est deja pret au telechargement.",
      icon: <Sparkles className="h-4 w-4 animate-pulse text-forex-mint" />
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="panel p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-premium text-forex-muted">Execution Desk</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">Nouvelle transaction</h3>
          </div>
          <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setIsRegular(false)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${!isRegular ? "bg-white/10 text-white" : "text-forex-muted hover:text-white"}`}
            >
              <UserPlus className="h-4 w-4" />
              Nouveau
            </button>
            <button
              type="button"
              onClick={() => setIsRegular(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${isRegular ? "bg-white/10 text-white" : "text-forex-muted hover:text-white"}`}
            >
              <Users className="h-4 w-4" />
              Habitué
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <select
                    {...field}
                    className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
                  >
                    <option value="BUY">Achat</option>
                    <option value="SELL">Vente</option>
                  </select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Devise</Label>
              <Controller
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <select
                    {...field}
                    className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{values.type === "BUY" ? "Montant donne (FX)" : "Montant donne (XAF)"}</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("amountGiven", { valueAsNumber: true })}
                className="h-12 rounded-2xl border-forex-border bg-white/5"
              />
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              {isRegular ? (
                <Controller
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
                    >
                      <option value="">-- Choisir un client --</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              ) : (
                <Input
                  {...form.register("clientName")}
                  placeholder="Nom du client"
                  className="h-12 rounded-2xl border-forex-border bg-white/5"
                />
              )}
            </div>
          </div>

          {values.type === "SELL" && (
            <div className="rounded-2xl border border-forex-mint/10 bg-forex-mint/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-forex-mint">Sélectionner la source du stock</Label>
                <Badge className="border-forex-mint/20 bg-forex-mint/10 text-forex-mint">
                  Dispo: {currentStock.toLocaleString()} {values.currencyCode}
                </Badge>
              </div>
              <Controller
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <select
                    {...field}
                    required={values.type === "SELL"}
                    className="flex h-12 w-full rounded-2xl border border-forex-mint/30 bg-white/5 px-4 text-sm text-white outline-none focus:border-forex-mint"
                  >
                    <option value="GENERAL">Stock Général / Bureau (Solde total)</option>
                    <optgroup label="Stocks Fournisseurs">
                      {suppliers.map((s) => {
                        const balance = stockBalances.find(b => b.code === values.currencyCode);
                        const sStock = balance?.suppliers.find((ss: any) => ss.id === s.id)?.balance ?? 0;
                        const sRate = balance?.suppliers.find((ss: any) => ss.id === s.id)?.averageBuyRate ?? null;
                        return (
                          <option key={s.id} value={s.id} disabled={Number(sStock) <= 0}>
                            {s.name} (Solde: {Number(sStock).toLocaleString()} {values.currencyCode}{sRate ? ` · PMA ${Number(sRate).toFixed(4)}` : ""})
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                )}
              />
              {values.type === "SELL" && computed.amountReceived > currentStock && (
                <p className="text-sm text-forex-danger font-medium">
                  ⚠️ Attention: Le montant de la vente ({computed.amountReceived}) dépasse le stock disponible chez ce fournisseur.
                </p>
              )}
            </div>
          )}

          {values.supplierId && values.supplierId !== "GENERAL" && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-lg border-white/10 bg-[#0F1625] text-forex-mint focus:ring-forex-mint"
                  {...form.register("isDebt")}
                />
                <div className="text-sm">
                  <span className="text-white group-hover:text-forex-mint transition">Recouvrer une créance</span>
                  {currentDebt > 0 && (
                    <p className="text-xs text-forex-muted">Créance actuelle: {currentDebt.toLocaleString()} {values.currencyCode}</p>
                  )}
                  <p className="text-xs text-forex-muted">{currentDebtLabel}</p>
                </div>
              </label>
            </div>
          )}

          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-premium text-forex-muted">Calcul instantane</p>
                <p className="mt-2 text-3xl font-semibold text-white">{computed.amountReceived.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-premium text-forex-muted">Taux applique</p>
                <p className="mt-2 text-xl font-semibold text-forex-mint">{computed.rate.toFixed(2)} XAF</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ReceiptText className="h-4 w-4" />
              )}
              Valider la transaction
            </Button>
            {transactionId ? (
              <Link href={`/api/transaction/${transactionId}/receipt`} target="_blank">
                <Button type="button" variant="secondary" size="lg">
                  Ouvrir le recu PDF
                </Button>
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel flex items-center justify-center p-6">
        <ReceiptPreview
          currency={selectedCurrency}
          amountGiven={values.amountGiven ?? 0}
          amountReceived={computed.amountReceived}
          type={values.type}
          clientName={isRegular ? selectedClient?.name : values.clientName}
          rate={computed.rate}
        />
      </section>
    </div>
  );
}
