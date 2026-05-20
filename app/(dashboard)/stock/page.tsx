import { auth } from "@/auth";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toNumber } from "@/lib/decimal";
import { getStockBalances } from "@/lib/stock";
import { StockMovementFormWrapper } from "@/components/stock/stock-movement-form-wrapper";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const balances = await getStockBalances();

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <p className="text-sm uppercase tracking-premium text-forex-muted">Inventory Control</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Stock devises</h2>
        <p className="mt-2 text-sm text-forex-muted">
          Vue consolidée des entrées/sorties (transactions + approvisionnements + ajustements).
        </p>
        <p className="mt-2 text-sm text-forex-muted">{isAdmin ? "Mode admin actif." : "Lecture seule."}</p>
      </section>

      {isAdmin && (
        <StockMovementFormWrapper />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Balances par devise</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Devise</TableHead>
                <TableHead>Entrées</TableHead>
                <TableHead>Sorties</TableHead>
                <TableHead>Solde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((b) => (
                <TableRow key={b.code}>
                  <TableCell>
                    <p className="font-semibold text-white">{b.code}</p>
                    <p className="text-sm text-forex-muted">{b.name}</p>
                  </TableCell>
                  <TableCell>{toNumber(b.inTotal).toFixed(2)}</TableCell>
                  <TableCell>{toNumber(b.outTotal).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">{toNumber(b.balance).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

