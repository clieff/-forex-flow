import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/dashboard/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { UsersManagement } from "@/components/settings/users-management";
import { CurrencyManagement } from "@/components/settings/currency-management";
import { hasPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user } = await getServerSession();
  if (!user || !hasPermission(user.role, "users:manage")) {
    redirect("/access-denied?from=/settings");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });

  const formattedCurrencies = currencies.map(c => ({
    ...c,
    buyRate: toNumber(c.buyRate),
    sellRate: toNumber(c.sellRate)
  }));

  return (
    <PageTransition className="space-y-4 md:space-y-6">
      <section className="panel p-4 md:p-6">
        <p className="text-sm uppercase tracking-premium text-forex-muted">Administration</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Paramètres et Accès</h2>
        <p className="mt-2 text-sm text-forex-muted">
          Gérez les accès de vos agents et la configuration générale du bureau.
        </p>
      </section>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comptes Agents</CardTitle>
                  <p className="mt-1 text-sm text-forex-muted">Gérez les accès à la plateforme.</p>
                </div>
                <Badge className="border-white/10 bg-white/[0.05]">{users.length} comptes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <UsersManagement initialUsers={users} currentUserId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Devises</CardTitle>
                  <p className="mt-1 text-sm text-forex-muted">Ajoutez de nouvelles monnaies au bureau.</p>
                </div>
                <Badge className="border-white/10 bg-white/[0.05]">{formattedCurrencies.length} devises</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CurrencyManagement initialCurrencies={formattedCurrencies} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du Bureau</CardTitle>
              <p className="mt-1 text-sm text-forex-muted">Ces informations apparaissent sur les reçus PDF.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-forex-muted">Nom du bureau</p>
                <p className="font-medium text-white">ForexFlow Pro</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-forex-muted">Numéro d'agrément</p>
                <p className="font-medium text-white">En attente de configuration</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-forex-muted">Adresse</p>
                <p className="font-medium text-white">Douala, Cameroun</p>
              </div>
              <p className="text-xs text-forex-muted italic mt-4">
                La configuration modifiable de ces champs sera bientôt disponible.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
