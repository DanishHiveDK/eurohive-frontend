/**
 * NextAuth.js v5 Configuration
 *
 * Providers: Google OAuth, LinkedIn OAuth, Email/Password (Credentials)
 * Session strategy: JWT (stateless, no DB sessions needed for most requests)
 * Adapter: Prisma (for Account/User linking on OAuth)
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

import type { UserRole } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: UserRole;
      status: string;
      kycVerified: boolean;
    };
  }
  interface User {
    role: UserRole;
    status: string;
    kycVerified: boolean;
    firstName: string;
    lastName: string;
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: UserRole;
    status: string;
    kycVerified: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days

  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },

  providers: [
    // ── Google OAuth ──────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // ── LinkedIn OAuth ────────────────────────────────────────
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "openid profile email" },
      },
    }),

    // ── Email / Password ──────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            kycVerified: true,
            avatarUrl: true,
            deletedAt: true,
          },
        });

        if (!user || user.deletedAt) return null;
        if (!user.passwordHash) return null; // OAuth-only account
        if (user.status === "banned" || user.status === "suspended") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatarUrl,
          role: user.role,
          status: user.status,
          kycVerified: user.kycVerified,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT: attach user data to token ────────────────────────
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.status = user.status;
        token.kycVerified = user.kycVerified;
      }

      // Allow session updates (e.g. after profile edit)
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.status) token.status = session.status;
        if (session.kycVerified !== undefined) token.kycVerified = session.kycVerified;
      }

      return token;
    },

    // ── Session: expose data to client ────────────────────────
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
        session.user.kycVerified = token.kycVerified as boolean;
      }
      return session;
    },

    // ── Sign-in: handle OAuth account linking ─────────────────
    async signIn({ user, account }) {
      // For credentials, we already validated above
      if (account?.provider === "credentials") return true;

      // For OAuth, check if user with this email exists
      if (account && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (existing) {
          // Link OAuth account to existing user
          if (existing.status === "banned" || existing.status === "suspended") {
            return false;
          }

          // Update last login
          await prisma.user.update({
            where: { id: existing.id },
            data: { lastLoginAt: new Date() },
          });
        }
        // New OAuth users will be created by the Prisma adapter
        // Note: They need to complete profile setup (role, country)
      }

      return true;
    },
  },

  events: {
    async createUser({ user }) {
      // Log new user registration
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "user.registered",
            resourceType: "user",
            resourceId: user.id,
            metadata: { method: "oauth" },
          },
        });
      }
    },
  },
});
