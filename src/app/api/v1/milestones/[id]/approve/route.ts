import { NextRequest, NextResponse } from "next/server";
import { approveMilestone, PaymentError } from "@/lib/services/payment";

/**
 * POST /api/v1/milestones/[id]/approve
 *
 * Client approves a submitted milestone deliverable.
 * Releases the escrow payment and initiates transfer to freelancer.
 * Deducts platform fee automatically.
 *
 * Response: { transferAmount, platformFee }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await approveMilestone({
      milestoneId: params.id,
      userId,
    });

    return NextResponse.json({
      success: true,
      milestoneId: params.id,
      ...result,
      message: `Milestone approved. €${result.transferAmount} will be transferred to the freelancer (€${result.platformFee} platform fee deducted).`,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      const statusMap: Record<string, number> = {
        MILESTONE_NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        INVALID_STATUS: 409,
        NO_PAYMENT: 400,
      };
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] || 400 }
      );
    }

    console.error("[API] Approve milestone error:", error);
    return NextResponse.json(
      { error: "Approval failed. Please try again." },
      { status: 500 }
    );
  }
}
