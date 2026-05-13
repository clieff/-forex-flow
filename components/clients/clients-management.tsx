"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Settings2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ClientDto, CurrencyDto } from "@/types/dto";

export function ClientsManagement() {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Client Form
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");

  async function loadData() {
    const [resClients, resCurrencies] = await Promise.all([
      fetch("/api/clients"),
      fetch("/api/rates")
    ]);
    if (resClients.ok) {
      const data = await resClients.json();
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
    if (!newName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, contact: newContact })
    });
    setLoading(false);
    if (res.ok) {
      setNewName("");
      setNewContact("");
      toast.success("Client ajouté");
      void loadData();
    } else {
      toast.error("Erreur lors de l'ajout");
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-premium text-forex-muted">Customer Relations</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Gestion des Habitués</h2>
          <p className="mt-2 text-sm text-forex-muted">Enregistrez vos clients réguliers et attribuez-leur des taux fixes personnalisés.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label>Nom du client</Label>
            <Input placeholder="Ex: Jean Dupont" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Contact (Optionnel)</Label>
            <Input placeholder="Téléphone ou Email" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={createClient} disabled={loading} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter le client
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} currencies={currencies} onUpdate={loadData} />
        ))}
      </div>
    </div>
  );
}

function ClientCard({ client, currencies, onUpdate }: { client: ClientDto; currencies: CurrencyDto[]; onUpdate: () => void }) {
  return (
    <Card className="overflow-hidden border-white/10 bg-white/5 transition-all hover:border-white/20">
      <CardHeader className="border-b border-white/10 bg-white/5 px-5 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{client.name}</CardTitle>
          <Settings2 className="h-4 w-4 text-forex-muted" />
        </div>
        {client.contact && <p className="text-xs text-forex-muted">{client.contact}</p>}
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-premium text-forex-muted">
            <span>Taux préférentiels</span>
            <span className="text-forex-mint">{client.fixedRates.length} devises</span>
          </div>
          
          <div className="space-y-2">
            {client.fixedRates.length > 0 ? (
              client.fixedRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0F1625] px-3 py-2 text-sm">
                  <span className="font-semibold text-white">{rate.currencyCode}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-forex-mint">A: {rate.buyRate ?? "—"}</span>
                    <span className="text-forex-danger">V: {rate.sellRate ?? "—"}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-forex-muted">Aucun taux fixe défini.</p>
            )}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="w-full">
                Configurer les taux
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-white/10 bg-[#0F1625] text-white">
              <DialogHeader>
                <DialogTitle>Taux fixes pour {client.name}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-6">
                {currencies.map((currency) => (
                  <RateEditor 
                    key={currency.code} 
                    client={client} 
                    currency={currency} 
                    onUpdate={onUpdate} 
                  />
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function RateEditor({ client, currency, onUpdate }: { client: ClientDto; currency: CurrencyDto; onUpdate: () => void }) {
  const existing = client.fixedRates.find(r => r.currencyCode === currency.code);
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
    if (res.ok) {
      toast.success(`Taux ${currency.code} mis à jour`);
      onUpdate();
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-white">{currency.code}</p>
        <p className="text-xs text-forex-muted">Standard: {currency.buyRate}/{currency.sellRate}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase">Taux Achat</Label>
          <Input 
            className="h-9 text-xs" 
            placeholder="Laisser vide" 
            value={buyRate} 
            onChange={e => setBuyRate(e.target.value)} 
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase">Taux Vente</Label>
          <Input 
            className="h-9 text-xs" 
            placeholder="Laisser vide" 
            value={sellRate} 
            onChange={e => setSellRate(e.target.value)} 
          />
        </div>
      </div>
      <Button size="sm" className="h-8 w-full text-[10px]" onClick={save} disabled={loading}>
        {loading ? "..." : "Appliquer ce taux fixe"}
      </Button>
    </div>
  );
}
