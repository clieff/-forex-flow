import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/dashboard/page-transition";
import { ClientsManagement } from "@/components/clients/clients-management";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { user } = await getServerSession();
  
  if (!user || !isAdminRole(user.role)) {
    redirect("/access-denied?from=/clients");
  }

  return (
    <PageTransition>
      <ClientsManagement />
    </PageTransition>
  );
}
