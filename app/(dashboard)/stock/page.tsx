import { getServerSession } from "@/lib/auth-session";
import { getStockBalances } from "@/lib/stock";
import { hasPermission } from "@/lib/roles";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { toNumber } from "@/lib/decimal";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { user } = await getServerSession();
  const balances = await getStockBalances();

  return <StockPageClient balances={balances.map((balance) => ({
    code: balance.code,
    name: balance.name,
    inTotal: toNumber(balance.inTotal),
    outTotal: toNumber(balance.outTotal),
    balance: toNumber(balance.balance),
    weightedBuyRate: balance.weightedBuyRate ? toNumber(balance.weightedBuyRate) : null,
    suppliers: balance.suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      balance: toNumber(supplier.balance),
      debt: toNumber(supplier.debt),
      averageBuyRate: supplier.averageBuyRate ? toNumber(supplier.averageBuyRate) : null,
      lastBuyRate: supplier.lastBuyRate ? toNumber(supplier.lastBuyRate) : null
    }))
  }))} />;
}
