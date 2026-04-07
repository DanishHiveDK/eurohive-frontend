import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  marketingConsent: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

/**
 * GET /api/v1/profile
 * Returns the authenticated user's full profile.
 */
export async function GET() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const profile = await prisma.user.findUnique({
    where: { id: userOrRes.id },
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
      marketingConsent: true,
      lastLoginAt: true,
      createdAt: true,
      freelancerProfile: {
        select: {
          title: true,
          bio: true,
          hourlyRate: true,
          availability: true,
          skills: true,
          languages: true,
          portfolioItems: true,
          ratingAvg: true,
          ratingCount: true,
          completedProjects: true,
          totalEarned: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: profile });
}

/**
 * PATCH /api/v1/profile
 * Update the authenticated user's personal information.
 */
export async function PATCH(request: NextRequest) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userOrRes.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      countryCode: true,
      avatarUrl: true,
      marketingConsent: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}
