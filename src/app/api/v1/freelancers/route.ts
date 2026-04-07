import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

import type { Prisma } from "@prisma/client";

const querySchema = z.object({
  q: z.string().max(200).optional(),
  skills: z.string().optional().transform((s) => s?.split(",").filter(Boolean)),
  country: z.string().length(2).optional(),
  availability: z.enum(["available", "busy", "unavailable"]).optional(),
  minRate: z.coerce.number().min(0).optional(),
  maxRate: z.coerce.number().max(1000).optional(),
  language: z.string().max(30).optional(),
  sortBy: z.enum(["rating", "rate_asc", "rate_desc", "newest", "completed"]).default("rating"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * GET /api/v1/freelancers
 * Public endpoint — search and filter verified freelancers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { q, skills, country, availability, minRate, maxRate, language, sortBy, page, limit } = parsed.data;

    const where: Prisma.FreelancerProfileWhereInput = {
      user: {
        status: "active",
        deletedAt: null,
        role: "freelancer",
        ...(country && { countryCode: country }),
      },
      ...(availability && { availability }),
      ...(minRate !== undefined && { hourlyRate: { gte: minRate } }),
      ...(maxRate !== undefined && { hourlyRate: { lte: maxRate } }),
      ...(skills?.length && { skills: { hasSome: skills } }),
      ...(language && { languages: { has: language } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { bio: { contains: q, mode: "insensitive" as const } },
          { skills: { hasSome: [q] } },
        ],
      }),
    };

    const orderByMap: Record<string, Prisma.FreelancerProfileOrderByWithRelationInput> = {
      rating: { ratingAvg: "desc" },
      rate_asc: { hourlyRate: "asc" },
      rate_desc: { hourlyRate: "desc" },
      newest: { createdAt: "desc" },
      completed: { completedProjects: "desc" },
    };

    const [freelancers, total] = await Promise.all([
      prisma.freelancerProfile.findMany({
        where,
        orderBy: orderByMap[sortBy],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          userId: true,
          title: true,
          bio: true,
          hourlyRate: true,
          availability: true,
          skills: true,
          languages: true,
          ratingAvg: true,
          ratingCount: true,
          completedProjects: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              countryCode: true,
              avatarUrl: true,
              kycVerified: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.freelancerProfile.count({ where }),
    ]);

    return NextResponse.json({
      data: freelancers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[API] GET /freelancers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
