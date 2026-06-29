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
  "/clients", "/suppliers", "/stock",
  "/api/rates", "/api/transactions", "/api/transaction", "/api/caisse",
  "/api/rapports", "/api/users", "/api/search", "/api/notifications", "/api/settings",
  "/api/clients", "/api/suppliers", "/api/currencies", "/api/stock", "/api/cash"
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || "forexflow-dev-secret-key-change-in-production-abc123xyz";

  // Le cookie de session peut porter deux noms selon l'environnement :
  //  - "authjs.session-token" en développement (HTTP)
  //  - "__Secure-authjs.session-token" en production (HTTPS, comme sur Vercel)
  // On tente les deux salts sur le vrai NextRequest pour récupérer le token
  // de façon fiable quel que soit l'environnement.
  let token = await getToken({ req, secret, salt: "authjs.session-token" });
  if (!token) {
    token = await getToken({ req, secret, salt: "__Secure-authjs.session-token" });
  }

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
