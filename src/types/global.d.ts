/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Google Analytics gtag.js type declarations
 */
interface Window {
  gtag: (
    command: "config" | "event" | "js" | "consent" | "set",
    targetOrAction: string | Date,
    params?: Record<string, any>
  ) => void;
  dataLayer: Array<any>;
}
