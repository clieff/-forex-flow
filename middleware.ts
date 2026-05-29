import { NextResponse } from "next/server";
import { auth } from "@/auth";

const adminOnlyPaths = ["/rates", "/logs", "/settings", "/stock", "/suppliers", "/caisse", "/rapports", "/api/rates", "/api/stock", "/api/suppliers", "/api/caisse", "/api/rapports", "/api/users", "/api/transactions/export"];
const protectedPrefixes = [
  "/",
  "/transactions",
  "/caisse",
  "/rapports",
  "/rates",
  "/logs",
  "/settings",
  "/api/rates",
  "/api/transactions",
  "/api/transaction",
  "/api/caisse",
  "/api/rapports",
  "/api/users",
  "/api/search"
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAdminOnly = adminOnlyPaths.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isAdminOnly && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
