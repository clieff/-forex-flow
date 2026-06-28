import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { Role } from "@prisma/client";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { getActiveAlerts } from "@/lib/alerts";

const secret = process.env.AUTH_SECRET || "forexflow-dev-secret-key-change-in-production-abc123xyz";

async function getSession() {
  const req = await headers();
  // Créer un objet compatible NextRequest pour getToken
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

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const token = await getSession();

  if (!token?.id) {
    redirect("/sign-in");
  }

  const role = (token.role as Role) ?? "AGENT";
  const userName = (token.name as string) ?? "User";

  const alerts = await getActiveAlerts();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1680px] gap-0 px-3 pt-3 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+16px)] md:gap-6 md:px-4 md:pt-6 md:pb-6 lg:px-6">
      <div className="hidden xl:block">
        <AppSidebar role={role} userName={userName} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
        <DashboardHeader role={role} userName={userName} alerts={alerts} />
        <MobileNav role={role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
