import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const EU_COUNTRIES = [
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR",
  "DE","GR","HU","IE","IT","LV","LT","LU","MT","NL",
  "PL","PT","RO","SK","SI","ES","SE",
];

const registerSchema = z.object({
  email: z.string().email().max(254).transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  role: z.enum(["freelancer", "client"]),
  countryCode: z.string().length(2).toUpperCase().refine(
    (c) => EU_COUNTRIES.includes(c),
    "Must be an EU country code"
  ),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy policy" }),
  }),
  marketingConsent: z.boolean().default(false),
});

/**
 * POST /api/v1/auth/register
 *
 * Creates a new user account with:
 * - bcrypt-hashed password (12 rounds)
 * - GDPR consent timestamp + consent log
 * - Audit log entry
 * - Empty freelancer profile (if role=freelancer)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role, countryCode, marketingConsent } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, deletedAt: true },
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Get client info for consent logging
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create user + freelancer profile + consent log + audit log in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          countryCode,
          gdprConsentAt: new Date(),
          marketingConsent,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          countryCode: true,
          status: true,
          createdAt: true,
        },
      });

      // Create empty freelancer profile if freelancer
      if (role === "freelancer") {
        await tx.freelancerProfile.create({
          data: {
            userId: newUser.id,
            title: "",
            skills: [],
            languages: [],
          },
        });
      }

      // Log GDPR consent (terms + privacy)
      await tx.consentLog.createMany({
        data: [
          {
            userId: newUser.id,
            consentType: "terms",
            granted: true,
            ipAddress: ip,
            userAgent,
          },
          {
            userId: newUser.id,
            consentType: "privacy",
            granted: true,
            ipAddress: ip,
            userAgent,
          },
          ...(marketingConsent
            ? [
                {
                  userId: newUser.id,
                  consentType: "marketing" as const,
                  granted: true,
                  ipAddress: ip,
                  userAgent,
                },
              ]
            : []),
        ],
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          action: "user.registered",
          resourceType: "user",
          resourceId: newUser.id,
          metadata: { role, countryCode, method: "credentials" },
          ipAddress: ip,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        message: "Account created successfully. You can now sign in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /auth/register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
