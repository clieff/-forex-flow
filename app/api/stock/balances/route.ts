import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStockBalances } from "@/lib/stock";
import { toNumber } from "@/lib/decimal";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balances = await getStockBalances();
  return NextResponse.json({
    balances: balances.map((b) => ({
      code: b.code,
      name: b.name,
      inTotal: toNumber(b.inTotal),
      outTotal: toNumber(b.outTotal),
      balance: toNumber(b.balance)
    }))
  });
}

