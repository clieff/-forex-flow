export type CurrencyDto = {
  code: string;
  name: string;
  flagCode: string;
  buyRate: number;
  sellRate: number;
  updatedAt: string | Date;
};

export type ClientRateDto = {
  id: string;
  clientId: string;
  currencyCode: string;
  buyRate: number | null;
  sellRate: number | null;
};

export type ClientDebtDto = {
  id: string;
  currencyCode: string;
  amount: number;
  note: string | null;
  updatedAt: string | Date;
};

export type ClientTransactionDto = {
  id: string;
  receiptNumber: string | null;
  type: "BUY" | "SELL";
  currencyCode: string;
  amountGiven: number;
  amountReceived: number;
  rateUsed: number;
  createdAt: string | Date;
  createdBy: string;
  supplierName: string | null;
};

export type ClientDto = {
  id: string;
  name: string;
  contact: string | null;
  fixedRates: ClientRateDto[];
  debts: ClientDebtDto[];
  recentTransactions: ClientTransactionDto[];
  createdAt: string | Date;
  summary: {
    totalTransactions: number;
    totalVolumeXaf: number;
    lastTransactionAt: string | Date | null;
    debtCurrencies: number;
  };
};

export type SupplierDebtDto = {
  id: string;
  currencyCode: string;
  amount: number;
  note: string | null;
  updatedAt: string | Date;
};

export type SupplierPositionDto = {
  currencyCode: string;
  stockBalance: number;
  debtBalance: number;
  totalPurchased: number;
  totalSold: number;
  averageBuyRate: number | null;
  lastBuyRate: number | null;
};

export type SupplierMovementDto = {
  id: string;
  currencyCode: string;
  direction: "IN" | "OUT";
  reason: string;
  amount: number;
  note: string | null;
  unitPrice: number | null;
  totalCostXaf: number | null;
  createdAt: string | Date;
  createdBy: string;
  transactionId: string | null;
  receiptNumber: string | null;
  clientName: string | null;
};

export type SupplierDto = {
  id: string;
  name: string;
  contact: string | null;
  debts: SupplierDebtDto[];
  positions: SupplierPositionDto[];
  recentMovements: SupplierMovementDto[];
  createdAt: string | Date;
  summary: {
    totalMovements: number;
    totalDebtCurrencies: number;
    outstandingDebt: number;
    lastMovementAt: string | Date | null;
  };
};
