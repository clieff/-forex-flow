import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/dashboard/page-transition";
import { ClientsManagement } from "@/components/clients/clients-management";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { user } = await getServerSession();
  
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <PageTransition>
      <ClientsManagement />
    </PageTransition>
  );
}
