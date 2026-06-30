import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "transactions:view"
  | "transactions:create"
  | "cash:view"
  | "cash:manage"
  | "rates:view"
  | "rates:manage"
  | "clients:view"
  | "clients:manage"
  | "suppliers:view"
  | "suppliers:manage"
  | "stock:view"
  | "stock:manage"
  | "reports:view"
  | "reports:manage"
  | "logs:view"
  | "users:manage"
  | "currencies:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "transactions:view",
    "transactions:create",
    "cash:view",
    "cash:manage",
    "rates:view",
    "rates:manage",
    "clients:view",
    "clients:manage",
    "suppliers:view",
    "suppliers:manage",
    "stock:view",
    "stock:manage",
    "reports:view",
    "reports:manage",
    "logs:view",
    "users:manage",
    "currencies:manage"
  ],
  AGENT: [
    "dashboard:view",
    "transactions:view",
    "transactions:create",
    "cash:view",
    "rates:view",
    "clients:view",
    "suppliers:view",
    "stock:view",
    "reports:view"
  ]
};

export function normalizeRole(role: string | null | undefined): Role | undefined {
  if (typeof role !== "string") return undefined;
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN" || normalized === "AGENT") {
    return normalized as Role;
  }
  return undefined;
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeRole(role) === "ADMIN";
}

export function hasPermission(role: string | null | undefined, permission: Permission) {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return ROLE_PERMISSIONS[normalized].includes(permission);
}

export function canAccessRoute(role: string | null | undefined, pathname: string) {
  if (pathname === "/" || pathname === "/transactions" || pathname.startsWith("/transactions/")) {
    return hasPermission(role, pathname.startsWith("/transactions") ? "transactions:view" : "dashboard:view");
  }

  if (pathname.startsWith("/caisse")) return hasPermission(role, "cash:view");
  if (pathname.startsWith("/rates")) return hasPermission(role, "rates:view");
  if (pathname.startsWith("/clients")) return hasPermission(role, "clients:view");
  if (pathname.startsWith("/suppliers")) return hasPermission(role, "suppliers:view");
  if (pathname.startsWith("/stock")) return hasPermission(role, "stock:view");
  if (pathname.startsWith("/rapports")) return hasPermission(role, "reports:view");
  if (pathname.startsWith("/logs")) return hasPermission(role, "logs:view");
  if (pathname.startsWith("/settings")) return hasPermission(role, "users:manage");

  if (pathname.startsWith("/api/transactions/export")) return hasPermission(role, "reports:manage");
  if (pathname.startsWith("/api/users")) return hasPermission(role, "users:manage");
  if (pathname.startsWith("/api/logs")) return hasPermission(role, "logs:view");
  if (pathname.startsWith("/api/rapports")) return hasPermission(role, "reports:view");
  if (pathname.startsWith("/api/rates")) return hasPermission(role, "rates:manage");
  if (pathname.startsWith("/api/clients")) return hasPermission(role, "clients:view");
  if (pathname.startsWith("/api/suppliers")) return hasPermission(role, "suppliers:view");
  if (pathname.startsWith("/api/stock")) return hasPermission(role, "stock:view");
  if (pathname.startsWith("/api/caisse")) return hasPermission(role, "cash:view");
  if (pathname.startsWith("/api/currencies")) return hasPermission(role, "currencies:manage");
  return true;
}
