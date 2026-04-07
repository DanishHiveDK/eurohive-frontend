"use client";

import { useState, useCallback } from "react";
import { EurohiveEvents } from "@/components/analytics";

interface PaymentState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook for funding a milestone via Mollie
 *
 * Usage:
 *   const { fundMilestone, loading, error } = useFundMilestone();
 *   await fundMilestone(milestoneId, "ideal");
 *   // → redirects to Mollie checkout
 */
export function useFundMilestone() {
  const [state, setState] = useState<PaymentState>({ loading: false, error: null });

  const fundMilestone = useCallback(
    async (milestoneId: string, method?: string) => {
      setState({ loading: true, error: null });

      try {
        const res = await fetch(`/api/v1/milestones/${milestoneId}/fund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Payment failed");
        }

        // Track event
        EurohiveEvents.milestoneFunded(
          parseFloat(data.amount),
          method || "default"
        );

        // Redirect to Mollie checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed";
        setState({ loading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { fundMilestone, ...state };
}

/**
 * Hook for approving a milestone (releasing escrow)
 *
 * Usage:
 *   const { approveMilestone, loading, error } = useApproveMilestone();
 *   const result = await approveMilestone(milestoneId);
 *   // → { transferAmount: "1980.00", platformFee: "220.00" }
 */
export function useApproveMilestone() {
  const [state, setState] = useState<PaymentState>({ loading: false, error: null });

  const approveMilestone = useCallback(async (milestoneId: string) => {
    setState({ loading: true, error: null });

    try {
      const res = await fetch(`/api/v1/milestones/${milestoneId}/approve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Track event
      EurohiveEvents.milestoneApproved(parseFloat(data.transferAmount));

      setState({ loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approval failed";
      setState({ loading: false, error: message });
      throw err;
    }
  }, []);

  return { approveMilestone, ...state };
}

/**
 * Hook for submitting a milestone deliverable
 */
export function useSubmitMilestone() {
  const [state, setState] = useState<PaymentState>({ loading: false, error: null });

  const submitMilestone = useCallback(
    async (milestoneId: string, message?: string) => {
      setState({ loading: true, error: null });

      try {
        const res = await fetch(`/api/v1/milestones/${milestoneId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Submission failed");
        }

        setState({ loading: false, error: null });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Submission failed";
        setState({ loading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { submitMilestone, ...state };
}

/**
 * Supported Mollie payment methods for the UI
 */
export const PAYMENT_METHODS = [
  { id: "ideal", label: "iDEAL", icon: "🏦", description: "Dutch bank transfer", countries: ["NL"] },
  { id: "creditcard", label: "Credit Card", icon: "💳", description: "Visa, Mastercard", countries: ["EU"] },
  { id: "bancontact", label: "Bancontact", icon: "🏦", description: "Belgian bank card", countries: ["BE"] },
  { id: "eps", label: "EPS", icon: "🏦", description: "Austrian bank transfer", countries: ["AT"] },
  { id: "giropay", label: "Giropay", icon: "🏦", description: "German bank transfer", countries: ["DE"] },
  { id: "sofort", label: "SOFORT", icon: "🏦", description: "Instant bank transfer", countries: ["DE", "AT", "BE"] },
  { id: "banktransfer", label: "SEPA Transfer", icon: "🏛️", description: "Standard bank transfer (1-3 days)", countries: ["EU"] },
] as const;
