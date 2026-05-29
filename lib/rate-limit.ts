import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate-limiter persistant en base de données : fonctionne sur plusieurs
 * instances / en serverless, contrairement à un compteur en mémoire.
 * Best-effort : tolère de petites courses sous forte concurrence.
 */
export async function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    // Fenêtre absente ou expirée : on (ré)ouvre une nouvelle fenêtre.
    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt }
      });
      return { ok: true, remaining: limit - 1, resetAt };
    }

    if (existing.count >= limit) {
      return { ok: false, remaining: 0, resetAt: existing.resetAt };
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } }
    });

    return {
      ok: true,
      remaining: Math.max(0, limit - updated.count),
      resetAt: existing.resetAt
    };
  } catch {
    // En cas d'indisponibilité du store, on n'enferme pas l'utilisateur dehors.
    return { ok: true, remaining: limit - 1, resetAt };
  }
}
