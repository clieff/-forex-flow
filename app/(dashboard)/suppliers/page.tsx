import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuppliersPanel } from "@/components/suppliers/suppliers-panel";
import { getSupplierHistory } from "@/lib/suppliers";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const history = await getSupplierHistory();

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <p className="text-sm uppercase tracking-premium text-forex-muted">
          Liquidity Network
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Fournisseurs</h2>
        <p className="mt-2 text-sm text-forex-muted">
          Gestion des fournisseurs pour approvisionner le stock devises.
        </p>
      </section>

      <div className="grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-[1.5fr_1fr] 2xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Annuaire fournisseurs</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-hidden">
            <SuppliersPanel />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="whitespace-nowrap">
              Historique des approvisionnements
            </CardTitle>
            <p className="mt-1 text-sm text-forex-muted">
              Derniers achats de devises auprès des fournisseurs.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-forex-muted">
                Aucun historique d'approvisionnement.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        Fournisseur
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Devise
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        Montant
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Agent</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell
                          className="font-semibold text-white max-w-[150px] truncate"
                          title={m.supplierName}
                        >
                          {m.supplierName}
                        </TableCell>
                        <TableCell>
                          <Badge className="border-white/10 bg-white/[0.05] whitespace-nowrap">
                            {m.currencyCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-forex-mint text-right">
                          +
                          {m.amount.toLocaleString("fr-FR", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className="text-forex-muted max-w-[120px] truncate"
                          title={m.createdBy}
                        >
                          {m.createdBy}
                        </TableCell>
                        <TableCell className="text-xs text-forex-muted whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
