import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const updateSchema = z.object({
  title: z.string().min(10).max(200).trim().optional(),
  description: z.string().min(50).max(10000).trim().optional(),
  category: z.string().max(50).optional(),
  budgetMin: z.number().min(50).optional(),
  budgetMax: z.number().min(50).optional(),
  requiredSkills: z.array(z.string().max(50)).max(15).optional(),
  deadline: z.string().datetime().optional().nullable(),
  visibility: z.enum(["public", "invite_only"]).optional(),
  status: z.enum(["open", "cancelled"]).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]
 * Returns project detail with proposals count and client info.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          countryCode: true,
          avatarUrl: true,
        },
      },
      proposals: {
        select: {
          id: true,
          status: true,
          amount: true,
          estimatedDays: true,
          createdAt: true,
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              countryCode: true,
              freelancerProfile: {
                select: {
                  title: true,
                  ratingAvg: true,
                  ratingCount: true,
                  completedProjects: true,
                  hourlyRate: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { proposals: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Hide proposal details from non-owners (freelancers only see their own)
  const user = await requireAuth();
  const isOwner = !(user instanceof NextResponse) && user.id === project.clientId;

  if (!isOwner) {
    // Strip other freelancers' proposals — only show count
    const ownProposal =
      !(user instanceof NextResponse)
        ? project.proposals.filter((p) => p.freelancer.id === user.id)
        : [];

    return NextResponse.json({
      data: {
        ...project,
        proposals: ownProposal,
        proposalCount: project._count.proposals,
      },
    });
  }

  return NextResponse.json({ data: project });
}

/**
 * PATCH /api/v1/projects/[id]
 * Update project (owner only, must be in open/draft status).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { clientId: true, status: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.clientId !== userOrRes.id) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }
  if (project.status !== "open" && project.status !== "draft") {
    return NextResponse.json(
      { error: "Can only edit open or draft projects" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.deadline ? { deadline: new Date(parsed.data.deadline) } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/v1/projects/[id]
 * Cancel project (owner only, must be open with no funded milestones).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { clientId: true, status: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.clientId !== userOrRes.id) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }
  if (project.status !== "open" && project.status !== "draft") {
    return NextResponse.json(
      { error: "Can only cancel open or draft projects" },
      { status: 400 }
    );
  }

  await prisma.project.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ success: true, message: "Project cancelled" });
}
