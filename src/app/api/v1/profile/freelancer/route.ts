import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

const updateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  bio: z.string().max(5000).trim().optional().nullable(),
  hourlyRate: z.number().min(5).max(500).optional().nullable(),
  availability: z.enum(["available", "busy", "unavailable"]).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  languages: z.array(z.string().max(30)).max(10).optional(),
  portfolioItems: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(1000).optional(),
        url: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .max(12)
    .optional(),
});

/**
 * GET /api/v1/profile/freelancer
 * Returns the authenticated freelancer's profile.
 */
export async function GET() {
  const userOrRes = await requireRole("freelancer");
  if (userOrRes instanceof NextResponse) return userOrRes;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: userOrRes.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          countryCode: true,
          avatarUrl: true,
          kycVerified: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Freelancer profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data: profile });
}

/**
 * PATCH /api/v1/profile/freelancer
 * Update freelancer-specific profile fields.
 */
export async function PATCH(request: NextRequest) {
  const userOrRes = await requireRole("freelancer");
  if (userOrRes instanceof NextResponse) return userOrRes;

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.freelancerProfile.update({
    where: { userId: userOrRes.id },
    data: parsed.data,
    select: {
      title: true,
      bio: true,
      hourlyRate: true,
      availability: true,
      skills: true,
      languages: true,
      portfolioItems: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}
