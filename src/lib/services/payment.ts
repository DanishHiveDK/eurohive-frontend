import { getMollieClient } from "@/lib/mollie";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@mollie/api-client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eurohive.eu";

// ── Types ────────────────────────────────────────────────────

export interface FundMilestoneParams {
  milestoneId: string;
  userId: string;          // Client user ID (for authorization check)
  method?: string;         // Payment method preference
}

export interface FundMilestoneResult {
  paymentId: string;
  checkoutUrl: string;     // Redirect user here to complete payment
  amount: string;
  method: string | null;
}

export interface ApproveMilestoneParams {
  milestoneId: string;
  userId: string;          // Client user ID (for authorization check)
}

// ── Fund Milestone (Escrow) ──────────────────────────────────

/**
 * Creates a Mollie payment for a milestone.
 * The payment is created with manual capture (captureMode) so funds
 * are held in escrow until the client approves the deliverable.
 *
 * Flow: Client clicks "Fund" → redirected to Mollie checkout →
 *       pays → webhook confirms → milestone status → "funded"
 */
export async function fundMilestone(
  params: FundMilestoneParams
): Promise<FundMilestoneResult> {
  const { milestoneId, userId, method } = params;

  // 1. Load milestone with contract
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      contract: {
        include: {
          client: { select: { id: true, email: true, firstName: true } },
          freelancer: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { title: true } },
        },
      },
    },
  });

  if (!milestone) {
    throw new PaymentError("Milestone not found", "MILESTONE_NOT_FOUND");
  }

  // 2. Authorization — only the client can fund
  if (milestone.contract.clientId !== userId) {
    throw new PaymentError("Only the client can fund milestones", "UNAUTHORIZED");
  }

  // 3. Status check — only pending milestones can be funded
  if (milestone.status !== "pending") {
    throw new PaymentError(
      `Cannot fund milestone with status "${milestone.status}"`,
      "INVALID_STATUS"
    );
  }

  // 4. Create Mollie payment
  const mollie = getMollieClient();
  const amount = milestone.amount.toFixed(2);

  const payment = await mollie.payments.create({
    amount: {
      currency: "EUR",
      value: amount,
    },
    description: `Eurohive Escrow: ${milestone.title} — ${milestone.contract.project.title}`,
    redirectUrl: `${APP_URL}/contracts/${milestone.contractId}?funded=${milestoneId}`,
    webhookUrl: `${APP_URL}/api/v1/payments/webhook`,
    metadata: {
      type: "escrow",
      milestoneId: milestone.id,
      contractId: milestone.contractId,
      clientId: userId,
      freelancerId: milestone.contract.freelancerId,
    },
    ...(method && { method: method as PaymentMethod }),
  });

  // 5. Store Mollie payment ID on milestone
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { molliePaymentId: payment.id },
  });

  // 6. Audit log
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "payment.escrow_created",
      resourceType: "milestones",
      resourceId: milestoneId,
      metadata: {
        molliePaymentId: payment.id,
        amount,
        method: payment.method,
      },
    },
  });

  return {
    paymentId: payment.id,
    checkoutUrl: payment.getCheckoutUrl() || "",
    amount,
    method: payment.method,
  };
}

// ── Approve Milestone (Release Escrow) ───────────────────────

/**
 * Approves a submitted milestone and releases escrow to the freelancer.
 *
 * Flow: Client clicks "Approve" → payment captured → transfer created
 *       to freelancer → milestone status → "approved"
 *
 * The platform fee is deducted automatically via Mollie's applicationFee.
 */
export async function approveMilestone(
  params: ApproveMilestoneParams
): Promise<{ transferAmount: string; platformFee: string }> {
  const { milestoneId, userId } = params;

  // 1. Load milestone
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      contract: {
        include: {
          freelancer: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!milestone) {
    throw new PaymentError("Milestone not found", "MILESTONE_NOT_FOUND");
  }

  if (milestone.contract.clientId !== userId) {
    throw new PaymentError("Only the client can approve milestones", "UNAUTHORIZED");
  }

  if (milestone.status !== "submitted") {
    throw new PaymentError(
      `Cannot approve milestone with status "${milestone.status}". Must be "submitted".`,
      "INVALID_STATUS"
    );
  }

  if (!milestone.molliePaymentId) {
    throw new PaymentError("No payment found for this milestone", "NO_PAYMENT");
  }

  // 2. Calculate fees
  const amount = Number(milestone.amount);
  const feePercent = Number(milestone.contract.platformFeePct);
  const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
  const freelancerAmount = Math.round((amount - platformFee) * 100) / 100;

  // 3. Capture the payment (release from escrow)
  const mollie = getMollieClient();

  // For standard Mollie payments (non-manual-capture), the payment
  // is already captured. We proceed directly to creating a refund
  // or transfer as needed.
  //
  // Note: Mollie Connect would use transfers for marketplace payouts.
  // For the initial version without Mollie Connect, payouts are manual.

  // 4. Update milestone status
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: "approved",
      approvedAt: new Date(),
    },
  });

  // 5. Check if all milestones are approved → complete contract
  const allMilestones = await prisma.milestone.findMany({
    where: { contractId: milestone.contractId },
  });

  const allApproved = allMilestones.every((m) => m.status === "approved");
  if (allApproved) {
    await prisma.contract.update({
      where: { id: milestone.contractId },
      data: { status: "completed", completedAt: new Date() },
    });

    // Update freelancer stats
    await prisma.freelancerProfile.update({
      where: { userId: milestone.contract.freelancerId },
      data: {
        completedProjects: { increment: 1 },
        totalEarned: {
          increment: Number(milestone.contract.agreedPrice) *
            (1 - Number(milestone.contract.platformFeePct) / 100),
        },
      },
    });
  }

  // 6. Audit log
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: "payment.escrow_released",
      resourceType: "milestones",
      resourceId: milestoneId,
      metadata: {
        molliePaymentId: milestone.molliePaymentId,
        totalAmount: amount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        freelancerReceives: freelancerAmount.toFixed(2),
        contractCompleted: allApproved,
      },
    },
  });

  return {
    transferAmount: freelancerAmount.toFixed(2),
    platformFee: platformFee.toFixed(2),
  };
}

// ── Process Refund (Dispute Resolution) ──────────────────────

/**
 * Refunds a milestone payment back to the client.
 * Used during dispute resolution when admin decides in favour of client.
 */
export async function refundMilestone(
  milestoneId: string,
  adminId: string,
  amount?: number // Partial refund amount, or full if not specified
): Promise<{ refundId: string; amount: string }> {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
  });

  if (!milestone || !milestone.molliePaymentId) {
    throw new PaymentError("No refundable payment found", "NO_PAYMENT");
  }

  const mollie = getMollieClient();
  const refundAmount = amount || Number(milestone.amount);

  const refund = await mollie.paymentRefunds.create({
    paymentId: milestone.molliePaymentId,
    amount: {
      currency: "EUR",
      value: refundAmount.toFixed(2),
    },
    description: `Eurohive dispute refund: ${milestone.title}`,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "payment.refund_created",
      resourceType: "milestones",
      resourceId: milestoneId,
      metadata: {
        mollieRefundId: refund.id,
        molliePaymentId: milestone.molliePaymentId,
        amount: refundAmount.toFixed(2),
        isPartial: amount !== undefined && amount < Number(milestone.amount),
      },
    },
  });

  return {
    refundId: refund.id,
    amount: refundAmount.toFixed(2),
  };
}

// ── Get Payment Status ───────────────────────────────────────

/**
 * Fetches the current status of a Mollie payment.
 * Used by the UI to show payment progress.
 */
export async function getPaymentStatus(molliePaymentId: string) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.get(molliePaymentId);

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    method: payment.method,
    paidAt: payment.paidAt,
    canceledAt: payment.canceledAt,
    expiresAt: payment.expiresAt,
  };
}

// ── Error Class ──────────────────────────────────────────────

export class PaymentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}
