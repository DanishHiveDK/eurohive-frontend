import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

import type { Prisma } from "@prisma/client";

const listSchema = z.object({
  status: z.enum(["active", "completed", "disputed", "cancelled"]).optional(),
  role: z.enum(["client", "freelancer"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * GET /api/v1/contracts
 * Returns contracts where the user is either client or freelancer.
 */
export async function GET(request: NextRequest) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = listSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { status, role, page, limit } = parsed.data;

  // Build where clause: show contracts where user is client OR freelancer
  const roleFilter: Prisma.ContractWhereInput =
    role === "client"
      ? { clientId: userOrRes.id }
      : role === "freelancer"
        ? { freelancerId: userOrRes.id }
        : { OR: [{ clientId: userOrRes.id }, { freelancerId: userOrRes.id }] };

  const where: Prisma.ContractWhereInput = {
    ...roleFilter,
    ...(status && { status }),
  };

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        agreedPrice: true,
        platformFeePct: true,
        createdAt: true,
        completedAt: true,
        project: {
          select: { id: true, title: true, category: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        freelancer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        milestones: {
          select: { id: true, title: true, amount: true, status: true, dueDate: true },
          orderBy: { position: "asc" },
        },
        _count: { select: { milestones: true } },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  return NextResponse.json({
    data: contracts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
