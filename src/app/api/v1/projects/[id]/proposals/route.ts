import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-utils";

const createProposalSchema = z.object({
  coverLetter: z.string().min(50).max(5000).trim(),
  amount: z.number().min(50).max(1000000),
  estimatedDays: z.number().min(1).max(365),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        amount: z.number().min(10),
        dueInDays: z.number().min(1).max(365),
      })
    )
    .min(1)
    .max(20),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]/proposals
 * Client sees all proposals; freelancers see only their own.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = project.clientId === userOrRes.id;

  const proposals = await prisma.proposal.findMany({
    where: {
      projectId,
      ...(isOwner ? {} : { freelancerId: userOrRes.id }),
    },
    include: {
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: proposals });
}

/**
 * POST /api/v1/projects/[id]/proposals
 * Freelancer submits a proposal with milestone breakdown.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = await params;
  const userOrRes = await requireRole("freelancer");
  if (userOrRes instanceof NextResponse) return userOrRes;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createProposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check project exists and is open
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.status !== "open") {
      return NextResponse.json({ error: "Project is not accepting proposals" }, { status: 400 });
    }
    if (project.clientId === userOrRes.id) {
      return NextResponse.json({ error: "Cannot submit a proposal on your own project" }, { status: 400 });
    }

    // Check for duplicate proposal
    const existing = await prisma.proposal.findFirst({
      where: { projectId, freelancerId: userOrRes.id, status: { not: "withdrawn" } },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already submitted a proposal for this project" }, { status: 409 });
    }

    // Validate milestone amounts sum to total
    const milestoneTotal = parsed.data.milestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(milestoneTotal - parsed.data.amount) > 0.01) {
      return NextResponse.json(
        { error: `Milestone amounts (€${milestoneTotal}) must equal total amount (€${parsed.data.amount})` },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        freelancerId: userOrRes.id,
        coverLetter: parsed.data.coverLetter,
        amount: parsed.data.amount,
        estimatedDays: parsed.data.estimatedDays,
        proposedMilestones: parsed.data.milestones,
        status: "pending",
      },
      select: {
        id: true,
        amount: true,
        estimatedDays: true,
        status: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userOrRes.id,
        action: "proposal.submitted",
        resourceType: "proposal",
        resourceId: proposal.id,
        metadata: { projectId, amount: parsed.data.amount },
      },
    });

    return NextResponse.json({ data: proposal }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /projects/[id]/proposals error:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}
