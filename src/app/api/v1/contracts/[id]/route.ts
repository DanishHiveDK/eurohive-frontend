import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/contracts/[id]
 * Returns full contract detail with milestones and participant info.
 * Only accessible by contract participants.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, title: true, description: true, category: true },
      },
      client: {
        select: {
          id: true, firstName: true, lastName: true,
          avatarUrl: true, countryCode: true,
        },
      },
      freelancer: {
        select: {
          id: true, firstName: true, lastName: true,
          avatarUrl: true, countryCode: true,
          freelancerProfile: {
            select: { title: true, ratingAvg: true },
          },
        },
      },
      milestones: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true, title: true, description: true,
          amount: true, status: true, dueDate: true,
          orderIndex: true, molliePaymentId: true,
          fundedAt: true, submittedAt: true, approvedAt: true,
        },
      },
      disputes: {
        select: {
          id: true, reason: true, status: true, createdAt: true,
          openedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      reviews: {
        select: {
          id: true, rating: true, comment: true, createdAt: true,
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Only participants can view
  if (contract.clientId !== userOrRes.id && contract.freelancerId !== userOrRes.id) {
    // Admins can view any contract
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }
  }

  // Calculate progress
  const totalMilestones = contract.milestones.length;
  const completedMilestones = contract.milestones.filter(
    (m) => m.status === "approved"
  ).length;
  const fundedAmount = contract.milestones
    .filter((m) => ["funded", "in_progress", "submitted", "approved"].includes(m.status))
    .reduce((sum, m) => sum + Number(m.amount), 0);
  const releasedAmount = contract.milestones
    .filter((m) => m.status === "approved")
    .reduce((sum, m) => sum + Number(m.amount), 0);

  return NextResponse.json({
    data: {
      ...contract,
      progress: {
        totalMilestones,
        completedMilestones,
        percentComplete: totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0,
        fundedAmount,
        releasedAmount,
        totalAmount: Number(contract.totalAmount),
      },
    },
  });
}

/**
 * PATCH /api/v1/contracts/[id]
 * Update contract status (complete, cancel).
 * Only the client can complete; either party can cancel (if no funded milestones).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const contract = await prisma.contract.findUnique({
    where: { id },
    select: {
      clientId: true, freelancerId: true, status: true,
      milestones: { select: { status: true } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const isClient = contract.clientId === userOrRes.id;
  const isFreelancer = contract.freelancerId === userOrRes.id;
  if (!isClient && !isFreelancer && userOrRes.role !== "admin") {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const schema = z.object({
    status: z.enum(["completed", "cancelled"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { status } = parsed.data;

  if (contract.status !== "active") {
    return NextResponse.json(
      { error: "Contract is not active" }, { status: 400 }
    );
  }

  if (status === "completed") {
    // Only client can mark completed
    if (!isClient) {
      return NextResponse.json(
        { error: "Only the client can complete a contract" }, { status: 403 }
      );
    }
    // All milestones must be approved
    const allApproved = contract.milestones.every((m) => m.status === "approved");
    if (!allApproved) {
      return NextResponse.json(
        { error: "All milestones must be approved before completing" }, { status: 400 }
      );
    }
  }

  if (status === "cancelled") {
    // Cannot cancel if any milestones are funded but not yet approved
    const hasFundedMilestones = contract.milestones.some(
      (m) => ["funded", "in_progress", "submitted"].includes(m.status)
    );
    if (hasFundedMilestones) {
      return NextResponse.json(
        { error: "Cannot cancel — there are funded milestones. Open a dispute instead." },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      status,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    },
    select: { id: true, status: true, completedAt: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: userOrRes.id,
      action: `contract.${status}`,
      resourceType: "contract",
      resourceId: id,
    },
  });

  return NextResponse.json({ data: updated });
}
