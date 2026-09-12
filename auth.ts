import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id       = user.id;
        token.role     = (user as any).role;
        token.name     = user.name;
        token.email    = user.email;
      }

      // When update() is called from client
      if (trigger === "update" && session) {
        if (session.name)     token.name     = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id       = token.id;
        (session.user as any).role     = token.role;
        session.user.name              = token.name as string;
        session.user.email             = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Portal", type: "text" },
      },
      async authorize(credentials) {
        console.log("=== AUTH ATTEMPT ===");
        console.log("Email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            console.log("User not found:", credentials.email);
            return null;
          }

          console.log("User found:", user.email, "Role:", user.role);

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            console.log("Password mismatch for:", user.email);
            return null;
          }

          if (user.role !== "ADMIN") {
            console.log(`Rejecting non-admin role: ${user.role}`);
            return null;
          }

          console.log("Auth SUCCESS:", user.email, user.role);

          return {
            id:       user.id,
            name:     user.name,
            email:    user.email,
            role:     user.role,
          };

        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
});
