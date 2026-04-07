"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = "G-P36LGX8DRX";

/**
 * Google Analytics (gtag.js)
 *
 * GDPR Compliance Notes:
 * - Analytics consent must be granted before tracking fires
 * - Default state: denied (via gtag consent mode)
 * - IP anonymization is enabled by default in GA4
 * - Cookie consent banner should update consent state
 *
 * The component loads in production only unless forced.
 * Consent mode ensures no data is collected until user
 * explicitly grants analytics consent via the cookie banner.
 */
export function GoogleAnalytics() {
  // Only load in production (or when explicitly enabled)
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "true"
  ) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          // GDPR: Default consent to denied — update when user consents
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500,
          });

          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=Strict;Secure',
          });
        `}
      </Script>
    </>
  );
}

/**
 * Call this function when user grants analytics consent
 * (e.g., from your cookie consent banner)
 */
export function grantAnalyticsConsent() {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
  }
}

/**
 * Call this function when user revokes analytics consent
 */
export function revokeAnalyticsConsent() {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
    });
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

/**
 * Pre-defined Eurohive events for consistent tracking
 */
export const EurohiveEvents = {
  // Auth
  signUp: (role: "freelancer" | "client") =>
    trackEvent("sign_up", "auth", role),
  login: (method: "email" | "google" | "linkedin") =>
    trackEvent("login", "auth", method),

  // Projects
  projectPosted: (category: string, budget: number) =>
    trackEvent("project_posted", "marketplace", category, budget),
  proposalSubmitted: (projectId: string) =>
    trackEvent("proposal_submitted", "marketplace", projectId),

  // Payments
  milestoneFunded: (amount: number, method: string) =>
    trackEvent("milestone_funded", "payment", method, amount),
  milestoneApproved: (amount: number) =>
    trackEvent("milestone_approved", "payment", "escrow_released", amount),

  // Engagement
  freelancerProfileViewed: (freelancerId: string) =>
    trackEvent("profile_viewed", "engagement", freelancerId),
  messageSent: () =>
    trackEvent("message_sent", "engagement"),
};
