// auth.config.ts
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [], // Les providers seront ajoutés dans auth.ts
  callbacks: {
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    }
  },
} satisfies any;
