import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-session";
import { getStockBalances } from "@/lib/stock";
import { toNumber } from "@/lib/decimal";

export async function GET() {
  const { user } = await getServerSession();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balances = await getStockBalances();
  return NextResponse.json({
    balances: balances.map((b) => ({
      code: b.code,
      name: b.name,
      inTotal: toNumber(b.inTotal),
      outTotal: toNumber(b.outTotal),
      balance: toNumber(b.balance),
      weightedBuyRate: b.weightedBuyRate ? toNumber(b.weightedBuyRate) : null,
      suppliers: b.suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        balance: toNumber(supplier.balance),
        debt: toNumber(supplier.debt),
        averageBuyRate: supplier.averageBuyRate ? toNumber(supplier.averageBuyRate) : null,
        lastBuyRate: supplier.lastBuyRate ? toNumber(supplier.lastBuyRate) : null
      }))
    }))
  });
}

