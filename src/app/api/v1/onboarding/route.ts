import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { role, firstName, lastName, countryCode, title, bio, hourlyRate, skills } = body;

  if (!role || !firstName || !lastName || !countryCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role,
        firstName,
        lastName,
        countryCode,
        gdprConsentAt: new Date(),
      },
    });

    // Create freelancer profile if role is freelancer
    if (role === "freelancer") {
      await prisma.freelancerProfile.upsert({
        where: { userId: session.user.id },
        update: {
          title: title || "Freelancer",
          bio: bio || null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          skills: skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        },
        create: {
          userId: session.user.id,
          title: title || "Freelancer",
          bio: bio || null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          skills: skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          languages: [],
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "user.onboarding_completed",
        resourceType: "user",
        resourceId: session.user.id,
        metadata: { role },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Onboarding]", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
