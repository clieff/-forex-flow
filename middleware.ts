import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const adminOnlyPaths = [
  "/rates", "/logs", "/settings", "/stock", "/suppliers", "/caisse", "/rapports",
  "/api/rates", "/api/stock", "/api/suppliers", "/api/caisse", "/api/rapports", "/api/users", "/api/transactions/export"
];
const protectedPrefixes = [
  "/",
  "/transactions", "/caisse", "/rapports", "/rates", "/logs", "/settings",
  "/clients", "/suppliers", "/stock",
  "/api/rates", "/api/transactions", "/api/transaction", "/api/caisse",
  "/api/rapports", "/api/users", "/api/search", "/api/notifications", "/api/settings",
  "/api/clients", "/api/suppliers", "/api/currencies", "/api/stock", "/api/cash"
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth; // contient la session déchiffrée

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return;
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !session) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }

  const isAdminOnly = adminOnlyPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const role = session?.user?.role;

  if (isAdminOnly && role !== "ADMIN") {
    const deniedUrl = new URL("/access-denied", req.nextUrl.origin);
    deniedUrl.searchParams.set("from", pathname);
    return Response.redirect(deniedUrl);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
