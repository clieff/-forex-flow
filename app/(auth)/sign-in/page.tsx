import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { SignInForm } from "@/components/auth/sign-in-form";

const secret = process.env.AUTH_SECRET || "forexflow-dev-secret-key-change-in-production-abc123xyz";

async function getSession() {
  const req = await headers();
  const cookieHeader = req.get("cookie") ?? "";
  let token = await getToken({
    req: { headers: { cookie: cookieHeader }, cookies: parseCookies(cookieHeader) } as any,
    secret,
    salt: "authjs.session-token"
  });
  if (!token) {
    token = await getToken({
      req: { headers: { cookie: cookieHeader }, cookies: parseCookies(cookieHeader) } as any,
      secret,
      salt: "__Secure-authjs.session-token"
    });
  }
  return token;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [key, ...val] = pair.trim().split("=");
    if (key) cookies[key] = val.join("=");
  });
  return cookies;
}

export default async function SignInPage() {
  const token = await getSession();

  if (token?.id) {
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
          <SignInForm />
        </section>
      </div>
    </main>
  );
}
