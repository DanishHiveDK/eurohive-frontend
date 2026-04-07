import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().max(2000).optional(),
  // File URLs would be added after S3 upload
  deliverableUrls: z.array(z.string().url()).optional(),
});

/**
 * POST /api/v1/milestones/[id]/submit
 *
 * Freelancer submits their deliverable for client review.
 * Milestone must be "funded" or "in_progress" to submit.
 *
 * After submission, the client can approve (release escrow)
 * or request a revision.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Load milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          select: { freelancerId: true, clientId: true },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Only the freelancer can submit
    if (milestone.contract.freelancerId !== userId) {
      return NextResponse.json(
        { error: "Only the freelancer can submit deliverables" },
        { status: 403 }
      );
    }

    // Must be funded, in_progress, or revision
    const validStatuses = ["funded", "in_progress", "revision"];
    if (!validStatuses.includes(milestone.status)) {
      return NextResponse.json(
        { error: `Cannot submit milestone with status "${milestone.status}"` },
        { status: 409 }
      );
    }

    // Update status
    await prisma.milestone.update({
      where: { id: params.id },
      data: {
        status: "submitted",
        submittedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "milestone.submitted",
        resourceType: "milestones",
        resourceId: params.id,
        metadata: {
          message: parsed.data.message,
          deliverableCount: parsed.data.deliverableUrls?.length || 0,
        },
      },
    });

    // TODO: Notify client that deliverable is ready for review
    // await notifyUser(milestone.contract.clientId, { ... });

    return NextResponse.json({
      success: true,
      milestoneId: params.id,
      status: "submitted",
      message: "Deliverable submitted. The client will review your work.",
    });
  } catch (error) {
    console.error("[API] Submit milestone error:", error);
    return NextResponse.json(
      { error: "Submission failed. Please try again." },
      { status: 500 }
    );
  }
}
