"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Clock3, HandCoins, ReceiptText, UserPlus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/formatters";
import type { ClientDto, CurrencyDto } from "@/types/dto";

export function ClientsManagement() {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");

  async function loadData() {
    const [resClients, resCurrencies] = await Promise.all([fetch("/api/clients"), fetch("/api/rates")]);
    if (resClients.ok) {
      const data = (await resClients.json()) as { clients: ClientDto[] };
      setClients(data.clients);
    }
    if (resCurrencies.ok) {
      const data = await resCurrencies.json();
      setCurrencies(data.currencies);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createClient() {
    if (!newName.trim()) {
      toast.error("Nom du client requis");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, contact: newContact })
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur lors de l'ajout du client");
      return;
    }

    setNewName("");
    setNewContact("");
    toast.success("Client ajoute");
    await loadData();
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-premium text-forex-muted">Customer Relations</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Clients et dettes</h2>
          <p className="mt-2 text-sm text-forex-muted">
            Vue globale des clients, des dettes ouvertes, des taux preferentiels et des dernieres transactions.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label>Nom du client</Label>
            <Input placeholder="Ex: Jean Dupont" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input placeholder="Telephone ou email" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={createClient} disabled={loading} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} currencies={currencies} onRefresh={loadData} />
        ))}
      </div>
    </div>
  );
}

function ClientCard({
  client,
  currencies,
  onRefresh
}: {
  client: ClientDto;
  currencies: CurrencyDto[];
  onRefresh: () => Promise<void> | void;
}) {
  const totalDebt = client.debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <Card id={`client-${client.id}`} className="overflow-hidden border-white/10 bg-white/5">
      <CardHeader className="gap-4 border-b border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-xl text-white">{client.name}</CardTitle>
            <p className="mt-1 text-sm text-forex-muted">{client.contact || "Aucun contact renseigne"}</p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold",
              totalDebt > 0 ? "bg-red-500/15 text-red-300" : totalDebt < 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-forex-muted"
            )}
          >
            Solde dette: {totalDebt.toFixed(2)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatPill icon={ReceiptText} label="Transactions" value={String(client.summary.totalTransactions)} />
          <StatPill icon={Wallet} label="Volume XAF" value={formatMoney(client.summary.totalVolumeXaf)} />
          <StatPill
            icon={Clock3}
            label="Derniere activite"
            value={client.summary.lastTransactionAt ? new Date(client.summary.lastTransactionAt).toLocaleDateString("fr-FR") : "Aucune"}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-premium text-forex-muted">Dettes clients</p>
              <ClientDebtDialog client={client} currencies={currencies} onRefresh={onRefresh} />
            </div>

            {client.debts.length > 0 ? (
              client.debts.map((debt) => (
                <div key={debt.id} className="rounded-2xl border border-white/10 bg-[#0F1625] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{debt.currencyCode}</p>
                      <p className="text-xs text-forex-muted">
                        Mis a jour le {new Date(debt.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className={cn("text-sm font-semibold", debt.amount > 0 ? "text-red-300" : "text-emerald-300")}>
                      {debt.amount.toFixed(2)}
                    </span>
                  </div>
                  {debt.note ? <p className="mt-2 text-xs text-forex-muted">{debt.note}</p> : null}
                </div>
              ))
            ) : (
              <EmptyState label="Aucune dette en cours pour ce client." />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-premium text-forex-muted">Taux preferentiels</p>
              <ClientRatesDialog client={client} currencies={currencies} onRefresh={onRefresh} />
            </div>

            {client.fixedRates.length > 0 ? (
              client.fixedRates.map((rate) => (
                <div key={rate.id} className="rounded-2xl border border-white/10 bg-[#0F1625] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rate.currencyCode}</span>
                    <BadgePercent className="h-4 w-4 text-forex-mint" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-emerald-300">Achat: {rate.buyRate ?? "-"}</span>
                    <span className="text-rose-300">Vente: {rate.sellRate ?? "-"}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="Aucun taux specifique configure." />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-forex-mint" />
            <p className="text-xs uppercase tracking-premium text-forex-muted">Historique global du client</p>
          </div>

          {client.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {client.recentTransactions.map((tx) => (
                <div key={tx.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {tx.receiptNumber ?? tx.id.slice(0, 8)} · {tx.type === "BUY" ? "Achat" : "Vente"} {tx.currencyCode}
                      </p>
                      <p className="text-xs text-forex-muted">
                        {new Date(tx.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · Agent {tx.createdBy}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-white">
                        Donne: {tx.amountGiven.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-forex-mint">
                        Recu: {tx.amountReceived.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} XAF
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-forex-muted">
                    <span>Taux: {tx.rateUsed.toFixed(4)}</span>
                    <span>Source fournisseur: {tx.supplierName || "Stock bureau"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Aucune transaction enregistree pour ce client." />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ClientRatesDialog({
  client,
  currencies,
  onRefresh
}: {
  client: ClientDto;
  currencies: CurrencyDto[];
  onRefresh: () => Promise<void> | void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Configurer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-24px)] border-white/10 bg-[#0F1625] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Taux fixes de {client.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          {currencies.map((currency) => (
            <RateEditor key={currency.code} client={client} currency={currency} onRefresh={onRefresh} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RateEditor({
  client,
  currency,
  onRefresh
}: {
  client: ClientDto;
  currency: CurrencyDto;
  onRefresh: () => Promise<void> | void;
}) {
  const existing = client.fixedRates.find((rate) => rate.currencyCode === currency.code);
  const [buyRate, setBuyRate] = useState(existing?.buyRate?.toString() ?? "");
  const [sellRate, setSellRate] = useState(existing?.sellRate?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/clients/${client.id}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyCode: currency.code,
        buyRate: buyRate ? Number(buyRate) : null,
        sellRate: sellRate ? Number(sellRate) : null
      })
    });
    setLoading(false);

    if (!res.ok) {
      toast.error(`Impossible de mettre a jour ${currency.code}`);
      return;
    }

    toast.success(`Taux ${currency.code} mis a jour`);
    await onRefresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{currency.code}</p>
        <p className="text-xs text-forex-muted">
          Standard {currency.buyRate}/{currency.sellRate}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs uppercase">Achat</Label>
          <Input value={buyRate} onChange={(e) => setBuyRate(e.target.value)} placeholder="Laisser vide" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs uppercase">Vente</Label>
          <Input value={sellRate} onChange={(e) => setSellRate(e.target.value)} placeholder="Laisser vide" />
        </div>
      </div>
      <Button size="sm" className="w-full" onClick={save} disabled={loading}>
        {loading ? "..." : "Appliquer"}
      </Button>
    </div>
  );
}

function ClientDebtDialog({
  client,
  currencies,
  onRefresh
}: {
  client: ClientDto;
  currencies: CurrencyDto[];
  onRefresh: () => Promise<void> | void;
}) {
  const [currencyCode, setCurrencyCode] = useState(currencies[0]?.code ?? "USD");
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Montant invalide");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/clients/${client.id}/debts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currencyCode,
        amount: Number(amount),
        operation,
        note
      })
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Impossible de mettre a jour la dette");
      return;
    }

    toast.success("Dette client mise a jour");
    setAmount("");
    setNote("");
    await onRefresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Ajuster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-24px)] border-white/10 bg-[#0F1625] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dette de {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Devise</Label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant={operation === "INCREASE" ? "default" : "secondary"} onClick={() => setOperation("INCREASE")}>
              Le client nous doit
            </Button>
            <Button variant={operation === "DECREASE" ? "default" : "secondary"} onClick={() => setOperation("DECREASE")}>
              Reduire / solder
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: avance, reliquat, arrangement" />
          </div>

          <Button className="w-full" onClick={save} disabled={loading}>
            {loading ? "Mise a jour..." : "Enregistrer l'ajustement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-forex-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-premium">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-forex-muted">{label}</p>;
}
