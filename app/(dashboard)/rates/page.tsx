import { auth } from "@/auth";
import { PageTransition } from "@/components/dashboard/page-transition";
import { RatesGrid } from "@/components/rates/rates-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRateManagementData } from "@/lib/dashboard";
import { toNumber } from "@/lib/decimal";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const session = await auth();
  const data = await getRateManagementData();
  const editable = session?.user.role === "ADMIN";

  return (
    <PageTransition className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-premium text-forex-muted">Rate Studio</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Gestion des taux & spreads</h2>
              <p className="mt-2 text-sm text-forex-muted">
                Cartes premium avec edition douce, auto-save et retour visuel instantane.
              </p>
            </div>
            <Badge className={editable ? "border-forex-mint/20 bg-forex-mint/10 text-forex-mint" : ""}>
              {editable ? "Mode admin actif" : "Lecture seule"}
            </Badge>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Journal recent</CardTitle>
            <p className="text-sm text-forex-muted">Trace rapide des derniers mouvements de taux.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.histories.map((history) => (
              <div key={history.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{history.currencyCode}</span>
                  <span className="text-forex-muted">{history.changedBy.name}</span>
                </div>
                <p className="mt-2 text-sm text-forex-muted">
                  {toNumber(history.oldBuyRate).toFixed(2)} / {toNumber(history.oldSellRate).toFixed(2)} {"→"}{" "}
                  <span className="font-semibold text-white">
                    {toNumber(history.newBuyRate).toFixed(2)} / {toNumber(history.newSellRate).toFixed(2)}
                  </span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <RatesGrid currencies={data.currencies} editable={editable} />
    </PageTransition>
  );
}
