/**
 * Mailchimp API Service (Server-side only)
 *
 * SECURITY: This module must NEVER be imported in client components.
 * The API key is kept server-side and proxied through /api/v1/waitlist.
 *
 * Mailchimp API v3 docs: https://mailchimp.com/developer/marketing/api/
 */

// ── Config ───────────────────────────────────────────────────

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  if (!apiKey) {
    throw new MailchimpError("MAILCHIMP_API_KEY is not set", "CONFIG_ERROR");
  }

  // Extract data centre from key suffix (e.g. "xxxxx-us6" → "us6")
  const parts = apiKey.split("-");
  const dc = parts[parts.length - 1];
  if (!dc) {
    throw new MailchimpError("Invalid Mailchimp API key format", "CONFIG_ERROR");
  }

  return {
    apiKey,
    baseUrl: `https://${dc}.api.mailchimp.com/3.0`,
    listId: process.env.MAILCHIMP_LIST_ID || "",
  };
}

// ── HTTP Helper ──────────────────────────────────────────────

async function mailchimpFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const { apiKey, baseUrl } = getConfig();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new MailchimpError(
      data.detail || data.title || "Mailchimp API error",
      data.status === 400 && data.title === "Member Exists"
        ? "ALREADY_SUBSCRIBED"
        : "API_ERROR",
      res.status
    );
  }

  return data;
}

// ── Public API ───────────────────────────────────────────────

export interface WaitlistSubscriber {
  email: string;
  role?: "freelancer" | "client" | "undecided";
  source?: string; // "hero" | "cta" | "footer"
  country?: string;
}

/**
 * Add a subscriber to the Eurohive waitlist.
 *
 * Uses "pending" status so Mailchimp sends a double opt-in
 * confirmation email (required for GDPR compliance).
 */
export async function addToWaitlist(
  subscriber: WaitlistSubscriber
): Promise<{ id: string; status: string }> {
  const { listId } = getConfig();

  if (!listId) {
    throw new MailchimpError(
      "MAILCHIMP_LIST_ID is not set. Run GET /api/v1/waitlist/lists to find your list ID.",
      "CONFIG_ERROR"
    );
  }

  const body: Record<string, any> = {
    email_address: subscriber.email.toLowerCase().trim(),
    status: "pending", // Double opt-in for GDPR
    tags: ["waitlist", "early-access"],
    merge_fields: {},
  };

  // Add optional merge fields
  if (subscriber.role) {
    body.merge_fields.ROLE = subscriber.role;
    body.tags.push(subscriber.role);
  }
  if (subscriber.source) {
    body.merge_fields.SOURCE = subscriber.source;
  }
  if (subscriber.country) {
    body.merge_fields.COUNTRY = subscriber.country;
  }

  try {
    const data = await mailchimpFetch(`/lists/${listId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return { id: data.id, status: data.status };
  } catch (error) {
    // If already subscribed, return success (idempotent)
    if (error instanceof MailchimpError && error.code === "ALREADY_SUBSCRIBED") {
      return { id: "existing", status: "already_subscribed" };
    }
    throw error;
  }
}

/**
 * Get all Mailchimp lists (audiences) for this account.
 * Useful for finding your MAILCHIMP_LIST_ID.
 */
export async function getLists(): Promise<
  Array<{ id: string; name: string; memberCount: number }>
> {
  const data = await mailchimpFetch("/lists?count=20&fields=lists.id,lists.name,lists.stats.member_count");

  return data.lists.map((list: any) => ({
    id: list.id,
    name: list.name,
    memberCount: list.stats?.member_count || 0,
  }));
}

/**
 * Get waitlist subscriber count for a specific list.
 */
export async function getSubscriberCount(): Promise<number> {
  const { listId } = getConfig();
  if (!listId) return 0;

  const data = await mailchimpFetch(
    `/lists/${listId}?fields=stats.member_count`
  );
  return data.stats?.member_count || 0;
}

// ── Error Class ──────────────────────────────────────────────

export class MailchimpError extends Error {
  code: string;
  httpStatus?: number;

  constructor(message: string, code: string, httpStatus?: number) {
    super(message);
    this.name = "MailchimpError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
