import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { Role } from "@prisma/client";

const secret = process.env.AUTH_SECRET || "forexflow-dev-secret-key-change-in-production-abc123xyz";

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [key, ...val] = pair.trim().split("=");
    if (key) cookies[key] = val.join("=");
  });
  return cookies;
}

/**
 * Replacement for auth() from NextAuth v5.
 * Uses getToken() directly to avoid the bcryptjs import crash in Node.js v24+.
 * Tries both cookie salt variants (standard and __Secure- prefix) for compatibility
 * with both direct and proxied environments.
 */
export async function getServerSession(): Promise<{
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: Role;
  } | null;
}> {
  const req = await headers();
  const cookieHeader = req.get("cookie") ?? "";
  const reqLike = { headers: { cookie: cookieHeader }, cookies: parseCookies(cookieHeader) } as any;

  let token = await getToken({ req: reqLike, secret, salt: "authjs.session-token" });
  if (!token) {
    token = await getToken({ req: reqLike, secret, salt: "__Secure-authjs.session-token" });
  }

  if (!token?.id) {
    return { user: null };
  }

  return {
    user: {
      id: token.id as string,
      email: (token.email as string) ?? null,
      name: (token.name as string) ?? null,
      role: (token.role as Role) ?? "AGENT"
    }
  };
}
