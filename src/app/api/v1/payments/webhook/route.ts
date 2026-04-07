import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/v1/payments/webhook
 *
 * Mollie sends a webhook when a payment status changes.
 * This handler verifies the payment with Mollie's API (not trusting
 * the webhook body) and updates the milestone accordingly.
 *
 * Mollie expects a 200 response within 15 seconds.
 * Any non-2xx triggers a retry (up to 10 times over 12 hours).
 *
 * SECURITY: This endpoint is public (called by Mollie).
 * We verify by fetching the payment directly from Mollie's API
 * rather than trusting the webhook payload.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract payment ID from Mollie's webhook
    const body = await request.formData();
    const paymentId = body.get("id") as string;

    if (!paymentId) {
      console.error("[Webhook] No payment ID in webhook body");
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    console.log(`[Webhook] Received notification for payment: ${paymentId}`);

    // 2. Fetch the actual payment from Mollie (don't trust the webhook body)
    const mollie = getMollieClient();
    const payment = await mollie.payments.get(paymentId);

    // 3. Extract our metadata
    const metadata = payment.metadata as {
      type?: string;
      milestoneId?: string;
      contractId?: string;
      clientId?: string;
      freelancerId?: string;
    };

    if (!metadata?.milestoneId || metadata.type !== "escrow") {
      console.log(`[Webhook] Ignoring non-escrow payment: ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    // 4. Idempotency check — find the milestone
    const milestone = await prisma.milestone.findUnique({
      where: { id: metadata.milestoneId },
    });

    if (!milestone) {
      console.error(`[Webhook] Milestone not found: ${metadata.milestoneId}`);
      return NextResponse.json({ received: true }); // 200 so Mollie stops retrying
    }

    // 5. Process based on payment status
    switch (payment.status) {
      case "paid": {
        // Only update if not already funded (idempotency)
        if (milestone.status === "pending" || milestone.status === "in_progress") {
          await prisma.milestone.update({
            where: { id: metadata.milestoneId },
            data: {
              status: "funded",
              fundedAt: new Date(),
              molliePaymentId: paymentId,
            },
          });

          // Audit log
          await prisma.auditLog.create({
            data: {
              actorId: metadata.clientId,
              action: "payment.escrow_funded",
              resourceType: "milestones",
              resourceId: metadata.milestoneId,
              metadata: {
                molliePaymentId: paymentId,
                amount: payment.amount.value,
                method: payment.method,
                paidAt: payment.paidAt,
              },
            },
          });

          console.log(
            `[Webhook] Milestone ${metadata.milestoneId} funded: €${payment.amount.value} via ${payment.method}`
          );

          // TODO: Send notification to freelancer
          // await notifyFreelancer(metadata.freelancerId, {
          //   type: "milestone_funded",
          //   milestoneId: metadata.milestoneId,
          //   amount: payment.amount.value,
          // });
        }
        break;
      }

      case "expired":
      case "canceled":
      case "failed": {
        // Payment failed — reset milestone if it was expecting payment
        if (milestone.molliePaymentId === paymentId) {
          await prisma.milestone.update({
            where: { id: metadata.milestoneId },
            data: {
              molliePaymentId: null, // Clear so client can retry
            },
          });

          // Audit log
          await prisma.auditLog.create({
            data: {
              actorId: metadata.clientId,
              action: `payment.${payment.status}`,
              resourceType: "milestones",
              resourceId: metadata.milestoneId,
              metadata: {
                molliePaymentId: paymentId,
                status: payment.status,
              },
            },
          });

          console.log(
            `[Webhook] Payment ${payment.status} for milestone ${metadata.milestoneId}`
          );

          // TODO: Notify client of failed payment
        }
        break;
      }

      case "pending":
      case "open": {
        // Payment is in progress — no action needed yet
        console.log(`[Webhook] Payment ${paymentId} status: ${payment.status}`);
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled status "${payment.status}" for ${paymentId}`);
      }
    }

    // 6. Always return 200 so Mollie knows we received it
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    // Return 200 even on error to prevent excessive retries
    // The audit log and monitoring will catch issues
    return NextResponse.json({ received: true });
  }
}
