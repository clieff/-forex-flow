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
    <PageTransition className="space-y-6 xl:space-y-8">
      <section className="panel px-6 py-6 xl:px-8 xl:py-7">
        <p className="text-sm uppercase tracking-premium text-forex-muted">
          Liquidity Network
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white xl:text-[2rem]">
          Fournisseurs
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-forex-muted">
          Gestion des fournisseurs pour approvisionner le stock devises.
        </p>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-white/10 px-6 py-5 xl:px-7 xl:py-6">
          <CardTitle className="text-base tracking-[0.18em] text-white/80">
            Annuaire fournisseurs
          </CardTitle>
          <p className="text-sm leading-6 text-forex-muted">
            Vue consolidee des profils, dettes actives et derniers mouvements.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-hidden px-6 py-6 xl:px-7 xl:py-7">
          <SuppliersPanel />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-white/10 px-6 py-5 xl:px-7 xl:py-6">
          <CardTitle className="text-base tracking-[0.18em] text-white/80">
            Historique des approvisionnements
          </CardTitle>
          <p className="text-sm leading-6 text-forex-muted">
            Derniers achats de devises aupres des fournisseurs.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="py-10 text-center text-sm text-forex-muted">
              Aucun historique d'approvisionnement.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-6 text-xs uppercase tracking-[0.16em] text-forex-muted">
                      Fournisseur
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.16em] text-forex-muted">
                      Devise
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right text-xs uppercase tracking-[0.16em] text-forex-muted">
                      Montant
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-xs uppercase tracking-[0.16em] text-forex-muted">
                      Agent
                    </TableHead>
                    <TableHead className="whitespace-nowrap pr-6 text-xs uppercase tracking-[0.16em] text-forex-muted">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell
                        className="max-w-[190px] truncate px-6 text-sm font-semibold text-white"
                        title={m.supplierName}
                      >
                        {m.supplierName}
                      </TableCell>
                      <TableCell>
                        <Badge className="whitespace-nowrap border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium">
                          {m.currencyCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums text-forex-mint">
                        +
                        {m.amount.toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        className="max-w-[160px] truncate text-sm text-forex-muted"
                        title={m.createdBy}
                      >
                        {m.createdBy}
                      </TableCell>
                      <TableCell className="whitespace-nowrap pr-6 text-sm tabular-nums text-forex-muted">
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
    </PageTransition>
  );
}
