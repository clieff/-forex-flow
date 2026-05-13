import type { Role, Type } from "@prisma/client";

export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  role?: Role;
  icon: "LayoutDashboard" | "ArrowLeftRight" | "History" | "BarChart3" | "Settings" | "Boxes" | "Truck" | "Users" | "Wallet" | "FileText" | "List";
}> = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/transactions/new", label: "Transaction", icon: "ArrowLeftRight" },
  { href: "/transactions", label: "Historique", icon: "List" },
  { href: "/caisse", label: "Caisse XAF", icon: "Wallet" },
  { href: "/clients", label: "Clients", icon: "Users", role: "ADMIN" },
  { href: "/stock", label: "Stock", icon: "Boxes", role: "ADMIN" },
  { href: "/suppliers", label: "Fournisseurs", icon: "Truck", role: "ADMIN" },
  { href: "/rates", label: "Taux", icon: "History", role: "ADMIN" },
  { href: "/rapports", label: "Rapports", icon: "FileText", role: "ADMIN" },
  { href: "/logs", label: "Logs", icon: "BarChart3", role: "ADMIN" },
  { href: "/settings", label: "Settings", icon: "Settings", role: "ADMIN" }
];

export const TRANSACTION_TYPES: Array<{ label: string; value: Type }> = [
  { label: "Achat", value: "BUY" },
  { label: "Vente", value: "SELL" }
];
