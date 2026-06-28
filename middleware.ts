import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminOnlyPaths = [
  "/rates", "/logs", "/settings", "/stock", "/suppliers", "/caisse", "/rapports",
  "/api/rates", "/api/stock", "/api/suppliers", "/api/caisse", "/api/rapports", "/api/users", "/api/transactions/export"
];
const protectedPrefixes = [
  "/",
  "/transactions", "/caisse", "/rapports", "/rates", "/logs", "/settings",
  "/api/rates", "/api/transactions", "/api/transaction", "/api/caisse",
  "/api/rapports", "/api/users", "/api/search", "/api/notifications", "/api/settings"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || "forexflow-dev-secret-key-change-in-production-abc123xyz",
    salt: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token"
  });

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !token) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAdminOnly = adminOnlyPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAdminOnly && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
