import type { PaymentMethod, Role, Type } from "@prisma/client";

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  role?: Role;
  icon: "LayoutDashboard" | "ArrowLeftRight" | "History" | "BarChart3" | "Settings" | "Boxes" | "Truck" | "Users" | "Wallet" | "FileText" | "List" | "Globe";
}> = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/transactions/new", label: "Transaction", icon: "ArrowLeftRight" },
  { href: "/transactions", label: "Historique", icon: "List" },
  { href: "/caisse", label: "Caisse XAF", icon: "Wallet" },
  { href: "/clients", label: "Clients", icon: "Users", role: "ADMIN" },
  { href: "/stock", label: "Stock", icon: "Boxes", role: "ADMIN" },
  { href: "/suppliers", label: "Fournisseurs", icon: "Truck", role: "ADMIN" },
  { href: "/rates", label: "Taux", icon: "History", role: "ADMIN" },
  { href: "/currencies", label: "Devises", icon: "Globe", role: "ADMIN" },
  { href: "/rapports", label: "Rapports", icon: "FileText", role: "ADMIN" },
  { href: "/logs", label: "Logs", icon: "BarChart3", role: "ADMIN" },
  { href: "/settings", label: "Settings", icon: "Settings", role: "ADMIN" }
];

export const TRANSACTION_TYPES: Array<{ label: string; value: Type }> = [
  { label: "Achat", value: "BUY" },
  { label: "Vente", value: "SELL" }
];

export const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Espèces", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Virement", value: "BANK_TRANSFER" },
  { label: "Dépôt bancaire", value: "BANK_DEPOSIT" }
];

// Garde-fou anti-fraude : écart maximal autorisé entre le taux personnalisé
// saisi par l'agent et le taux par défaut (devise ou taux fixe client).
export const MAX_CUSTOM_RATE_DEVIATION = 0.05; // ±5 %
