import { getStockBalances } from "@/lib/stock";
import { toNumber } from "@/lib/decimal";

export type StockAlert = {
  id: string;
  type: "STOCK_LOW";
  currencyCode: string;
  message: string;
  currentBalance: number;
};

// Seuil d'alerte par défaut (peut être rendu configurable en DB plus tard)
const ALERT_THRESHOLD = 1000;

export async function getActiveAlerts(): Promise<StockAlert[]> {
  const balances = await getStockBalances();
  const alerts: StockAlert[] = [];

  for (const b of balances) {
    const balanceNum = toNumber(b.balance);
    if (balanceNum < ALERT_THRESHOLD) {
      alerts.push({
        id: `alert-stock-${b.code}`,
        type: "STOCK_LOW",
        currencyCode: b.code,
        currentBalance: balanceNum,
        message: `Le stock de ${b.code} est bas (${balanceNum.toFixed(2)} restants). Pensez à approvisionner.`
      });
    }
  }

  return alerts;
}
