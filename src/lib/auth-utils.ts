/**
 * Server-side Authentication Utilities
 *
 * Use these in Server Components and API routes:
 * - getCurrentUser()  → returns user or null
 * - requireAuth()     → returns user or throws 401
 * - requireRole(role) → returns user or throws 403
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
  status: string;
  kycVerified: boolean;
}

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as AuthUser;
}

/**
 * Require authentication. Returns user or a 401 NextResponse.
 * Use in API routes:
 *   const userOrRes = await requireAuth();
 *   if (userOrRes instanceof NextResponse) return userOrRes;
 *   const user = userOrRes;
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  if (user.status === "banned" || user.status === "suspended") {
    return NextResponse.json(
      { error: "Account suspended" },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Require a specific role. Returns user or a 403 NextResponse.
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<AuthUser | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }
  return result;
}

/**
 * Get full user profile from database (for profile pages, settings).
 * Returns more data than the JWT session.
 */
export async function getFullProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      countryCode: true,
      avatarUrl: true,
      status: true,
      kycVerified: true,
      kycVerifiedAt: true,
      mfaEnabled: true,
      gdprConsentAt: true,
      marketingConsent: true,
      lastLoginAt: true,
      createdAt: true,
      freelancerProfile: true,
    },
  });
}
