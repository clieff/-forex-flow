import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SearchParams {
  from?: string;
}

export default async function AccessDeniedPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const from = searchParams.from ?? "cette page";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <Card className="w-full border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader>
            <p className="text-sm uppercase tracking-[0.3em] text-forex-muted">Accès refusé</p>
            <CardTitle className="mt-2 text-3xl">Cette section est réservée à l’administration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-forex-muted">
              Votre compte est connecté, mais vous n’avez pas les droits nécessaires pour ouvrir
              <span className="font-semibold text-white"> {from}</span>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-gradient px-5 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.01]"
              >
                Retour au dashboard
              </Link>
              <Link
                href="/transactions"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-forex-border bg-white/5 px-5 text-sm font-semibold text-forex-text transition hover:bg-white/10"
              >
                Voir les transactions
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
