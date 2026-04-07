import createMollieClient, { MollieClient } from "@mollie/api-client";

/**
 * Mollie API Client (Singleton)
 *
 * SECURITY: The API key is loaded from MOLLIE_API_KEY environment variable.
 * Never hardcode API keys — add them to .env.local:
 *
 *   MOLLIE_API_KEY="live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *
 * For development/testing, use a test key:
 *   MOLLIE_API_KEY="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 */

let mollieClient: MollieClient | null = null;

export function getMollieClient(): MollieClient {
  if (!mollieClient) {
    const apiKey = process.env.MOLLIE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "MOLLIE_API_KEY is not set. Add it to your .env.local file."
      );
    }

    mollieClient = createMollieClient({ apiKey });
  }

  return mollieClient;
}

/**
 * Check if we're running in Mollie test mode
 */
export function isMollieTestMode(): boolean {
  const key = process.env.MOLLIE_API_KEY || "";
  return key.startsWith("test_");
}

/**
 * Supported payment methods for EU marketplace
 */
export const SUPPORTED_PAYMENT_METHODS = [
  "ideal",        // Netherlands (most popular)
  "creditcard",   // Visa, Mastercard (EU-wide)
  "bancontact",   // Belgium
  "eps",          // Austria
  "giropay",      // Germany
  "sofort",       // Germany, Austria, Belgium
  "banktransfer", // SEPA (EU-wide, slower)
] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];
