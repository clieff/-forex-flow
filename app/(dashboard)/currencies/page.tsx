import { getServerSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { PageTransition } from "@/components/dashboard/page-transition";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { hasPermission } from "@/lib/roles";
import { CurrencyStudio } from "@/components/currencies/currency-studio";

export const dynamic = "force-dynamic";

export default async function CurrenciesPage() {
  const { user } = await getServerSession();

  if (!user || !hasPermission(user.role, "currencies:manage")) {
    redirect("/access-denied?from=/currencies");
  }

  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" }
  });

  const initialCurrencies = currencies.map((currency) => ({
    code: currency.code,
    name: currency.name,
    flagCode: currency.flagCode,
    buyRate: toNumber(currency.buyRate),
    sellRate: toNumber(currency.sellRate)
  }));

  return (
    <PageTransition>
      <CurrencyStudio initialCurrencies={initialCurrencies} />
    </PageTransition>
  );
}
