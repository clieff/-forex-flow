import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Banknote, Landmark, Smartphone, Wallet } from "lucide-react";
import { getServerSession } from "@/lib/auth-session";
import { getCaisseData } from "@/lib/caisse";
import { formatMoney } from "@/lib/formatters";
import { hasPermission } from "@/lib/roles";
import { PageTransition } from "@/components/dashboard/page-transition";
import { CaissePanel } from "@/components/caisse/caisse-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const kindIcons = { CASH: Banknote, MOBILE_MONEY: Smartphone, BANK: Landmark, OTHER: Wallet };

const reasonLabels: Record<string, string> = { DEPOT: "Dépôt", RETRAIT: "Retrait", DEPENSE: "Dépense", AJUSTEMENT: "Ajustement", AUTRE: "Autre" };

function AccountBalances({ title, balances }: { title: string; balances: Array<{ id: string; name: string; kind: "CASH" | "MOBILE_MONEY" | "BANK" | "OTHER"; balance: number }> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {balances.map((account) => {
          const Icon = kindIcons[account.kind];
          return (
            <div key={account.id} className="min-w-0 border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm text-forex-muted">{account.name}</p><Icon className="h-4 w-4 text-forex-mint" /></div>
              <p className={`mt-3 text-xl font-semibold ${account.balance >= 0 ? "text-white" : "text-forex-danger"}`}>{formatMoney(account.balance)}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export const dynamic = "force-dynamic";

export default async function CaissePage() {
  const { user } = await getServerSession();
  if (!user) redirect("/sign-in");

  const isAdmin = hasPermission(user.role, "cash:manage") && user.role === "ADMIN";
  const data = await getCaisseData({ userId: user.id, includeGlobal: isAdmin });
  const { personal, global } = data;

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm uppercase tracking-premium text-forex-muted">Trésorerie</p><h2 className="mt-2 text-3xl font-semibold text-white">Ma caisse</h2></div>
          <Badge className={personal.balance >= 0 ? "border-forex-mint/20 bg-forex-mint/10 px-4 py-2 text-base text-forex-mint" : "border-forex-danger/20 bg-forex-danger/10 px-4 py-2 text-base text-forex-danger"}><Wallet className="mr-2 h-4 w-4" />{formatMoney(personal.balance)}</Badge>
        </div>
      </section>

      <AccountBalances title="Mes comptes XAF" balances={personal.accountBalances} />

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Devises cash de ma caisse</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {personal.fxCashBalances.length === 0 ? <p className="text-sm text-forex-muted">Aucune devise cash dans votre caisse.</p> : personal.fxCashBalances.map((item) => <div key={item.currencyCode} className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-4"><span className="font-semibold text-white">{item.currencyCode}</span><span className={item.balance >= 0 ? "text-forex-mint" : "text-forex-danger"}>{item.balance.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {item.currencyCode}</span></div>)}
          </CardContent>
        </Card>
        <CaissePanel accounts={personal.accountBalances.filter((account) => account.isActive)} canManageAccounts={isAdmin} />
      </section>

      {global && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold text-white">Caisse globale</h3><Badge className="border-white/10 bg-white/[0.05] px-3 py-1.5 text-white">{formatMoney(global.balance)}</Badge></div>
          <AccountBalances title="Tous les comptes XAF" balances={global.accountBalances} />
          <Card>
            <CardHeader><CardTitle>Devises cash globales</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">{global.fxCashBalances.length === 0 ? <p className="text-sm text-forex-muted">Aucune devise cash enregistrée.</p> : global.fxCashBalances.map((item) => <Badge key={item.currencyCode} className="border-white/10 bg-white/[0.05] px-3 py-2 text-white">{item.currencyCode}: {item.balance.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</Badge>)}</CardContent>
          </Card>
        </section>
      )}

      <Card>
        <CardHeader><CardTitle>Mes mouvements manuels</CardTitle></CardHeader>
        <CardContent>
          {personal.movements.length === 0 ? <p className="py-8 text-center text-sm text-forex-muted">Aucun mouvement manuel.</p> : (
            <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Compte</TableHead><TableHead>Montant</TableHead><TableHead>Motif</TableHead><TableHead>Note</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{personal.movements.map((movement) => <TableRow key={movement.id}><TableCell><Badge className={movement.direction === "IN" ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint" : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger"}>{movement.direction === "IN" ? <ArrowDownLeft className="mr-1 h-3 w-3" /> : <ArrowUpRight className="mr-1 h-3 w-3" />}{movement.direction === "IN" ? "Entrée" : "Sortie"}</Badge></TableCell><TableCell>{movement.accountName}</TableCell><TableCell className={movement.direction === "IN" ? "text-forex-mint" : "text-forex-danger"}>{movement.direction === "IN" ? "+" : "-"}{formatMoney(movement.amount)}</TableCell><TableCell>{reasonLabels[movement.reason] ?? movement.reason}</TableCell><TableCell className="text-forex-muted">{movement.note ?? "-"}</TableCell><TableCell className="text-forex-muted">{new Date(movement.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</TableCell></TableRow>)}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
