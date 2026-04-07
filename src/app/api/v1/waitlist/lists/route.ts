import { NextResponse } from "next/server";
import { getLists } from "@/lib/services/mailchimp";

/**
 * GET /api/v1/waitlist/lists
 *
 * Returns all Mailchimp audiences (lists) for your account.
 * Use this to find your MAILCHIMP_LIST_ID, then add it to .env.local.
 *
 * This endpoint should be removed or secured before going live.
 */
export async function GET() {
  try {
    const lists = await getLists();
    return NextResponse.json({
      lists,
      hint: "Copy the 'id' of your waitlist audience and set it as MAILCHIMP_LIST_ID in .env.local",
    });
  } catch (error) {
    console.error("[Waitlist] Error fetching lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch lists. Check your MAILCHIMP_API_KEY." },
      { status: 500 }
    );
  }
}
