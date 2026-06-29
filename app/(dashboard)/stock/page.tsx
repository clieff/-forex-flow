import { getServerSession } from "@/lib/auth-session";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toNumber } from "@/lib/decimal";
import { getStockBalances } from "@/lib/stock";
import { StockMovementFormWrapper } from "@/components/stock/stock-movement-form-wrapper";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { user } = await getServerSession();
  const isAdmin = isAdminRole(user?.role);
  const balances = await getStockBalances();

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <p className="text-sm uppercase tracking-premium text-forex-muted">Inventory Control</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Stock devises</h2>
        <p className="mt-2 text-sm text-forex-muted">
          Accessible sur mobile et desktop avec une vue consolidee des soldes, des prix moyens d'achat et du detail fournisseur.
        </p>
        <p className="mt-2 text-sm text-forex-muted">{isAdmin ? "Mode admin actif." : "Lecture seule."}</p>
      </section>

      {isAdmin ? <StockMovementFormWrapper /> : null}

      <div className="grid gap-4 lg:hidden">
        {balances.map((balance) => (
          <Card key={balance.code} className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{balance.code}</span>
                <span className="text-sm text-forex-mint">
                  {balance.weightedBuyRate ? `${toNumber(balance.weightedBuyRate).toFixed(4)} XAF` : "Sans prix moyen"}
                </span>
              </CardTitle>
              <p className="text-sm text-forex-muted">{balance.name}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Metric label="Entrees" value={toNumber(balance.inTotal).toFixed(2)} />
                <Metric label="Sorties" value={toNumber(balance.outTotal).toFixed(2)} />
                <Metric label="Solde" value={toNumber(balance.balance).toFixed(2)} />
              </div>
              {balance.suppliers.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-premium text-forex-muted">Par fournisseur</p>
                  {balance.suppliers.map((supplier) => (
                    <div key={supplier.id} className="rounded-2xl border border-white/10 bg-[#0F1625] px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{supplier.name}</span>
                        <span className="text-forex-mint">{toNumber(supplier.balance).toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-forex-muted">
                        <span>Dette {toNumber(supplier.debt).toFixed(2)}</span>
                        <span>Prix moyen {supplier.averageBuyRate ? toNumber(supplier.averageBuyRate).toFixed(4) : "-"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Balances par devise</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Devise</TableHead>
                <TableHead>Entrees</TableHead>
                <TableHead>Sorties</TableHead>
                <TableHead>Solde</TableHead>
                <TableHead>Prix moyen achat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => (
                <TableRow key={balance.code}>
                  <TableCell>
                    <p className="font-semibold text-white">{balance.code}</p>
                    <p className="text-sm text-forex-muted">{balance.name}</p>
                  </TableCell>
                  <TableCell>{toNumber(balance.inTotal).toFixed(2)}</TableCell>
                  <TableCell>{toNumber(balance.outTotal).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">{toNumber(balance.balance).toFixed(2)}</TableCell>
                  <TableCell>{balance.weightedBuyRate ? toNumber(balance.weightedBuyRate).toFixed(4) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-xs uppercase tracking-premium text-forex-muted">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
