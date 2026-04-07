import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const freelancer = await prisma.user.findFirst({
    where: { id: params.id, role: "freelancer", deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      countryCode: true,
      avatarUrl: true,
      createdAt: true,
      freelancerProfile: true,
    },
  });

  if (!freelancer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(freelancer);
}
