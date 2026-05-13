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
    <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <div className="hidden xl:block">
        <AppSidebar role={session.user.role} userName={session.user.name ?? "User"} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <DashboardHeader role={session.user.role} userName={session.user.name ?? "User"} alerts={alerts} />
        <MobileNav role={session.user.role} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
