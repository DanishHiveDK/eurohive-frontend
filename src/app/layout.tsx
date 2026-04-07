import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { SessionProvider } from "@/components/providers/session-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Eurohive — EU Freelance Marketplace",
    template: "%s | Eurohive",
  },
  description:
    "GDPR-compliant freelance marketplace connecting top European freelancers with businesses across 27 EU countries. Secure Mollie payments with milestone escrow.",
  keywords: [
    "freelance marketplace",
    "EU freelancers",
    "GDPR compliant",
    "Mollie payments",
    "European marketplace",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eurohive.eu"),
  openGraph: {
    title: "Eurohive — EU Freelance Marketplace",
    description: "Where Europe's best freelancers meet great projects",
    siteName: "Eurohive",
    locale: "en_EU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body>
        <SessionProvider>
          <>
            <GoogleAnalytics />
            {children}
            <CookieConsent />
          </>
        </SessionProvider>
      </body>
    </html>
  );
}
