import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuppliersPanel } from "@/components/suppliers/suppliers-panel";
import { getSupplierHistory } from "@/lib/suppliers";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const history = await getSupplierHistory();

  return (
    <PageTransition className="space-y-6">
      <section className="panel p-6">
        <p className="text-sm uppercase tracking-premium text-forex-muted">Liquidity Network</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Fournisseurs</h2>
        <p className="mt-2 text-sm text-forex-muted">Gestion des fournisseurs pour approvisionner le stock devises.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Annuaire fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <SuppliersPanel />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des approvisionnements</CardTitle>
            <p className="mt-1 text-sm text-forex-muted">Derniers achats de devises auprès des fournisseurs.</p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-forex-muted">Aucun historique d'approvisionnement.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-white">{m.supplierName}</TableCell>
                      <TableCell>
                        <Badge className="border-white/10 bg-white/[0.05]">{m.currencyCode}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-forex-mint">+{m.amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-forex-muted">{m.createdBy}</TableCell>
                      <TableCell className="text-xs text-forex-muted">
                        {new Date(m.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

