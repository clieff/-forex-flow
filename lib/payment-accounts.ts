import type { PaymentAccountKind, PaymentMethod } from "@prisma/client";

export const paymentMethodByAccountKind: Record<PaymentAccountKind, PaymentMethod> = {
  CASH: "CASH",
  MOBILE_MONEY: "MOBILE_MONEY",
  BANK: "BANK_TRANSFER",
  OTHER: "CASH"
};

export const paymentAccountKindLabels: Record<PaymentAccountKind, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  BANK: "Banque",
  OTHER: "Autre"
};
