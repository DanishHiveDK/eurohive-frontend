import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addToWaitlist, getSubscriberCount, MailchimpError } from "@/lib/services/mailchimp";

// ── Validation ───────────────────────────────────────────────

const subscribeSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254)
    .transform((e) => e.toLowerCase().trim()),
  role: z.enum(["freelancer", "client", "undecided"]).optional(),
  source: z.string().max(50).optional(),
});

// ── Simple in-memory rate limiter (per IP, resets on restart) ─

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max signups per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ── CORS headers for standalone landing page ─────────────────

function corsHeaders() {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "https://eurohive.eu",
    "https://www.eurohive.eu",
  ];

  return {
    "Access-Control-Allow-Origin": allowedOrigins.join(", "),
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ── OPTIONS (CORS preflight) ─────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// ── POST /api/v1/waitlist ────────────────────────────────────

/**
 * Subscribe an email to the Eurohive waitlist.
 *
 * Request:  { email: string, role?: "freelancer"|"client"|"undecided", source?: string }
 * Response: { success: true, status: "pending"|"already_subscribed" }
 *
 * - Uses Mailchimp double opt-in (GDPR-compliant)
 * - Rate limited: 5 signups per IP per hour
 * - CORS enabled for eurohive.eu
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many signups. Please try again later." },
        { status: 429, headers: corsHeaders() }
      );
    }

    // 2. Parse & validate
    const body = await request.json().catch(() => ({}));
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid email" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 3. Subscribe via Mailchimp
    const result = await addToWaitlist({
      email: parsed.data.email,
      role: parsed.data.role,
      source: parsed.data.source,
    });

    // 4. Audit log (if prisma is available)
    // await prisma.auditLog.create({
    //   data: {
    //     action: "waitlist.signup",
    //     resourceType: "waitlist",
    //     metadata: { email: parsed.data.email, source: parsed.data.source, status: result.status },
    //   },
    // });

    console.log(`[Waitlist] ${parsed.data.email} → ${result.status} (source: ${parsed.data.source})`);

    return NextResponse.json(
      {
        success: true,
        status: result.status,
        message:
          result.status === "already_subscribed"
            ? "You're already on the list!"
            : "Check your inbox to confirm your email.",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    if (error instanceof MailchimpError) {
      console.error(`[Waitlist] Mailchimp error: ${error.message} (${error.code})`);
      return NextResponse.json(
        { error: "Signup failed. Please try again." },
        { status: error.httpStatus || 500, headers: corsHeaders() }
      );
    }

    console.error("[Waitlist] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// ── GET /api/v1/waitlist ─────────────────────────────────────

/**
 * Returns the current waitlist subscriber count.
 * Useful for displaying on the landing page.
 */
export async function GET() {
  try {
    const count = await getSubscriberCount();
    return NextResponse.json({ count }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json({ count: 0 }, { headers: corsHeaders() });
  }
}
