import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/dashboard/page-transition";
import { ClientsManagement } from "@/components/clients/clients-management";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <PageTransition>
      <ClientsManagement />
    </PageTransition>
  );
}
