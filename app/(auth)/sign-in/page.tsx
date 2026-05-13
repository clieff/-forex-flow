import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,201,167,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,180,216,0.12),transparent_24%)]" />
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel relative overflow-hidden p-10">
          <div className="absolute right-6 top-6 rounded-full border border-forex-mint/25 bg-forex-mint/10 px-4 py-1 text-xs uppercase tracking-premium text-forex-mint">
            Internal Treasury OS
          </div>
          <div className="max-w-xl space-y-6">
            <p className="text-sm uppercase tracking-[0.28em] text-forex-muted">ForexFlow Pro</p>
            <h1 className="text-balance text-5xl font-semibold leading-tight text-white">
              Le bureau de change prend enfin une allure de cockpit premium.
            </h1>
            <p className="text-lg leading-8 text-forex-muted">
              Tableau de bord luxueux, spreads pilotables en direct, recus PDF et historique complet des flux pour votre equipe FX.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              ["Spread Control", "Ajustement ultra rapide des marges"],
              ["Receipt Engine", "PDF stylise et trace instantanee"],
              ["Ops Visibility", "Vue 360 des transactions et tendances"]
            ].map(([title, description]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-forex-muted">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel glass-sidebar p-8">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-premium text-forex-muted">Secure Access</p>
            <h2 className="text-3xl font-semibold text-white">Connexion equipe</h2>
            <p className="text-sm text-forex-muted">
              Admin demo: `admin@forexflow.pro / admin123` ou agent demo: `agent@forexflow.pro / agent123`.
            </p>
          </div>
          <SignInForm />
        </section>
      </div>
    </main>
  );
}
