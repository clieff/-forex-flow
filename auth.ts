import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createLog } from "@/lib/logs";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await createLog({
          category: "USER",
          action: "LOGIN",
          details: `Session ouverte par ${user.name}`,
          userId: user.id
        });
      }
    }
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        // Throttle anti-brute-force, par email ET par IP (best-effort, persistant en base).
        const emailKey = typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "unknown";
        const ip = request instanceof Request ? getRequestIp(request) : "unknown";

        const [byEmail, byIp] = await Promise.all([
          checkRateLimit({ key: `login:email:${emailKey}`, limit: 10, windowMs: 10 * 60_000 }),
          checkRateLimit({ key: `login:ip:${ip}`, limit: 30, windowMs: 10 * 60_000 })
        ]);

        if (!byEmail.ok || !byIp.ok) {
          return null;
        }

        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ]
});
