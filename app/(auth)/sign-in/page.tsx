import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Suspense } from "react";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,201,167,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,180,216,0.12),transparent_24%)]" />
      <div className="w-full max-w-xl">
        <section className="panel glass-sidebar p-8">
          <div className="mb-8 space-y-3">
            <p className="text-sm uppercase tracking-premium text-forex-muted">Secure Access</p>
            <h2 className="text-3xl font-semibold text-white">Connexion equipe</h2>
          </div>
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-white">Chargement...</div>}>
            <SignInForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
