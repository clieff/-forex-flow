import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { getActiveAlerts } from "@/lib/alerts";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const alerts = await getActiveAlerts();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1680px] gap-0 px-3 pt-3 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+16px)] md:gap-6 md:px-4 md:pt-6 md:pb-6 lg:px-6">
      <div className="hidden xl:block">
        <AppSidebar role={session.user.role} userName={session.user.name ?? "User"} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
        <DashboardHeader role={session.user.role} userName={session.user.name ?? "User"} alerts={alerts} />
        <MobileNav role={session.user.role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
