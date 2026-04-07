import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-utils";

import type { Prisma } from "@prisma/client";

// ── Query validation ─────────────────────────────────────────

const listSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  budgetType: z.enum(["fixed", "hourly"]).optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().optional(),
  skills: z.string().optional().transform((s) => s?.split(",").filter(Boolean)),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  country: z.string().length(2).optional(),
  sortBy: z.enum(["newest", "budget_asc", "budget_desc", "deadline"]).default("newest"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const createSchema = z.object({
  title: z.string().min(10).max(200).trim(),
  description: z.string().min(50).max(10000).trim(),
  category: z.string().min(1).max(50),
  budgetType: z.enum(["fixed", "hourly"]),
  budgetMin: z.number().min(50).max(1000000),
  budgetMax: z.number().min(50).max(1000000),
  currency: z.string().length(3).default("EUR"),
  requiredSkills: z.array(z.string().max(50)).min(1).max(15),
  deadline: z.string().datetime().optional(),
  visibility: z.enum(["public", "invite_only"]).default("public"),
  attachments: z.array(z.string().url()).max(5).optional(),
});

// ── GET /api/v1/projects ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = listSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { q, category, budgetType, minBudget, maxBudget, skills, status, country, sortBy, page, limit } = parsed.data;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      status: status || "open",
      visibility: "public",
      client: { status: "active", deletedAt: null },
      ...(category && { category }),
      ...(budgetType && { budgetType }),
      ...(minBudget && { budgetMax: { gte: minBudget } }),
      ...(maxBudget && { budgetMin: { lte: maxBudget } }),
      ...(skills?.length && { requiredSkills: { hasSome: skills } }),
      ...(country && { client: { status: "active", deletedAt: null, countryCode: country } }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    };

    // Build orderBy
    const orderByMap: Record<string, Prisma.ProjectOrderByWithRelationInput> = {
      newest: { createdAt: "desc" },
      budget_asc: { budgetMin: "asc" },
      budget_desc: { budgetMax: "desc" },
      deadline: { deadline: "asc" },
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: orderByMap[sortBy],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          budgetType: true,
          budgetMin: true,
          budgetMax: true,
          currency: true,
          requiredSkills: true,
          status: true,
          deadline: true,
          createdAt: true,
          _count: { select: { proposals: true } },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              countryCode: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] GET /projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/v1/projects ────────────────────────────────────

export async function POST(request: NextRequest) {
  const userOrRes = await requireRole("client");
  if (userOrRes instanceof NextResponse) return userOrRes;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate budget range
    if (data.budgetMin > data.budgetMax) {
      return NextResponse.json(
        { error: "Minimum budget cannot exceed maximum budget" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        budgetType: data.budgetType,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        currency: data.currency,
        requiredSkills: data.requiredSkills,
        deadline: data.deadline ? new Date(data.deadline) : null,
        visibility: data.visibility,
        attachments: data.attachments || [],
        status: "open",
        clientId: userOrRes.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userOrRes.id,
        action: "project.created",
        resourceType: "project",
        resourceId: project.id,
        metadata: { title: data.title, category: data.category, budgetType: data.budgetType },
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
