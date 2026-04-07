"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { grantAnalyticsConsent, revokeAnalyticsConsent } from "./google-analytics";

type ConsentState = "pending" | "accepted" | "rejected" | "custom";

interface ConsentPreferences {
  necessary: true; // Always required
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_COOKIE_KEY = "eurohive_consent";

/**
 * GDPR Cookie Consent Banner
 *
 * Implements granular consent per GDPR Art. 6 and ePrivacy Directive.
 * Integrates with Google Analytics consent mode — analytics only
 * fires after explicit user consent.
 *
 * Necessary cookies (session, CSRF) are always active as they are
 * required for the service to function (legitimate interest).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Check for existing consent on mount
  useEffect(() => {
    const stored = getCookie(CONSENT_COOKIE_KEY);
    if (!stored) {
      // No consent recorded — show banner
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(stored) as ConsentPreferences;
        setPreferences(parsed);
        // Apply stored consent
        if (parsed.analytics) {
          grantAnalyticsConsent();
        }
      } catch {
        setVisible(true);
      }
    }
  }, []);

  function acceptAll() {
    const prefs: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(prefs);
    grantAnalyticsConsent();
    setVisible(false);
  }

  function rejectAll() {
    const prefs: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(prefs);
    revokeAnalyticsConsent();
    setVisible(false);
  }

  function saveCustom() {
    saveConsent(preferences);
    if (preferences.analytics) {
      grantAnalyticsConsent();
    } else {
      revokeAnalyticsConsent();
    }
    setVisible(false);
  }

  function saveConsent(prefs: ConsentPreferences) {
    setCookie(CONSENT_COOKIE_KEY, JSON.stringify(prefs), 365);

    // TODO: Also record in consent_logs table via API
    // fetch("/api/v1/consent", {
    //   method: "POST",
    //   body: JSON.stringify({ type: "cookies", granted: prefs }),
    // });
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl">🍪</span>
          <div className="flex-1">
            <h4 className="text-[15px] font-bold text-midnight font-serif">
              Cookie preferences
            </h4>
            <p className="text-[13px] text-midnight-300 leading-relaxed mt-1">
              We use cookies to keep you signed in and improve your experience.
              Analytics cookies help us understand how you use Eurohive.
              You can change your preferences at any time in Settings.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="mb-4 space-y-2 pl-9">
            <label className="flex items-center gap-3 p-2.5 rounded-lg bg-cream/60">
              <input type="checkbox" checked disabled className="accent-honey" />
              <div>
                <span className="text-[13px] font-semibold text-midnight">Necessary</span>
                <span className="text-2xs text-midnight-200 ml-1.5">Always active</span>
                <p className="text-2xs text-midnight-300 mt-0.5">
                  Session management, security (CSRF), authentication. Required for the platform to work.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-lg bg-cream/60 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, analytics: e.target.checked }))
                }
                className="accent-honey"
              />
              <div>
                <span className="text-[13px] font-semibold text-midnight">Analytics</span>
                <p className="text-2xs text-midnight-300 mt-0.5">
                  Google Analytics (GA4) — anonymous usage data to improve the platform. IP anonymisation enabled.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-2.5 rounded-lg bg-cream/60 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, marketing: e.target.checked }))
                }
                className="accent-honey"
              />
              <div>
                <span className="text-[13px] font-semibold text-midnight">Marketing</span>
                <p className="text-2xs text-midnight-300 mt-0.5">
                  Used to personalise recommendations. Currently not in use — reserved for future features.
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2 pl-9">
          <Button onClick={acceptAll} size="sm">
            Accept all
          </Button>
          <Button onClick={rejectAll} variant="secondary" size="sm">
            Reject all
          </Button>
          {showDetails ? (
            <Button onClick={saveCustom} variant="ghost" size="sm">
              Save preferences
            </Button>
          ) : (
            <Button
              onClick={() => setShowDetails(true)}
              variant="ghost"
              size="sm"
            >
              Customise
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cookie helpers (no external dependency) ──────────────────

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
