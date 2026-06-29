import { auth } from "@/auth";
import type { Role } from "@prisma/client";

/**
 * Wrapper server-side autour de auth() de NextAuth v5.
 *
 * Conserve la même interface que la version précédente
 * ({ user: {...} | null }) afin que toutes les routes API qui
 * l'utilisent restent compatibles, mais s'appuie sur auth()
 * qui est la méthode officielle et stable de NextAuth.
 *
 * auth() lit le cookie de session via headers()/cookies() de Next.js
 * de façon fiable, en production comme en développement.
 */
export async function getServerSession(): Promise<{
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: Role;
  } | null;
}> {
  const session = await auth();

  if (!session?.user) {
    return { user: null };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      role: session.user.role
    }
  };
}
