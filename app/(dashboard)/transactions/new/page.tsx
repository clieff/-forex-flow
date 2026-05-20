import { auth } from "@/auth";
import { PageTransition } from "@/components/dashboard/page-transition";
import { NewTransactionForm } from "@/components/transactions/new-transaction-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransactionFormData } from "@/lib/dashboard";
import { formatMoney } from "@/lib/formatters";
import { toNumber } from "@/lib/decimal";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const session = await auth();
  const data = await getTransactionFormData(session?.user.role ?? "AGENT");

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Desk context</CardTitle>
            <p className="text-sm text-forex-muted">Un snapshot des derniers tickets pour garder le tempo du desk.</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
            {data.recentTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="rounded-[18px] md:rounded-[24px] border border-white/10 bg-white/[0.03] p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{transaction.currency.code}</p>
                  <Badge
                    className={
                      transaction.type === "BUY"
                        ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint"
                        : "border-forex-danger/20 bg-forex-danger/10 text-forex-danger"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">{formatMoney(toNumber(transaction.amountReceived))}</p>
                <p className="mt-2 text-sm text-forex-muted">{transaction.createdBy.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <section className="panel p-4 md:p-6">
          <p className="text-sm uppercase tracking-premium text-forex-muted">Execution policy</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Taux gele, validation nette</h2>
          <p className="mt-2 max-w-2xl text-sm text-forex-muted">
            Achat: Montant recu (XAF) = Montant donne (USD/EUR) x buyRate. Vente: Montant recu (USD/EUR) = Montant
            donne (XAF) / sellRate.
          </p>
        </section>
      </div>

      <NewTransactionForm 
        currencies={data.currencies} 
        clients={data.clients} 
        suppliers={data.suppliers}
        stockBalances={data.stockBalances}
      />
    </PageTransition>
  );
}
