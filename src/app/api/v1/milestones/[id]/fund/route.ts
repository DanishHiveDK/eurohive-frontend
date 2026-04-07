import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fundMilestone, PaymentError } from "@/lib/services/payment";

// TODO: Replace with actual auth
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

const bodySchema = z.object({
  method: z.string().optional(), // Preferred payment method
});

/**
 * POST /api/v1/milestones/[id]/fund
 *
 * Creates a Mollie payment for the milestone (escrow).
 * Returns a checkout URL — redirect the client there to pay.
 *
 * Request:  { method?: "ideal" | "creditcard" | ... }
 * Response: { paymentId, checkoutUrl, amount, method }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // const userId = session.user.id;

    // TODO: Replace with real auth — for now, extract from header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Provide x-user-id header." },
        { status: 401 }
      );
    }

    // 2. Validate body
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 3. Create Mollie payment
    const result = await fundMilestone({
      milestoneId: params.id,
      userId,
      method: parsed.data.method,
    });

    // 4. Return checkout URL
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentError) {
      const statusMap: Record<string, number> = {
        MILESTONE_NOT_FOUND: 404,
        UNAUTHORIZED: 403,
        INVALID_STATUS: 409,
      };
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusMap[error.code] || 400 }
      );
    }

    console.error("[API] Fund milestone error:", error);
    return NextResponse.json(
      { error: "Payment creation failed. Please try again." },
      { status: 500 }
    );
  }
}
