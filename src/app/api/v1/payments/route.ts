import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  type: z.enum(["all", "escrow", "payout", "refund"]).default("all"),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

/**
 * GET /api/v1/payments/transactions
 *
 * Returns the authenticated user's transaction history.
 * Pulls from audit_logs where action starts with "payment."
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = querySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, from, to, page, limit } = parsed.data;

    // Build filter
    const actionFilter =
      type === "all"
        ? { startsWith: "payment." }
        : { startsWith: `payment.${type}` };

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = {
      actorId: userId,
      action: actionFilter,
      ...(Object.keys(dateFilter).length > 0 && {
        recordedAt: dateFilter,
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions.map((t) => ({
        id: t.id,
        action: t.action,
        metadata: t.metadata,
        timestamp: t.recordedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API] Transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
