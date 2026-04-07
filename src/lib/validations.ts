import { z } from "zod";
import { EU_COUNTRY_CODES } from "./utils";

// ── Auth ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  countryCode: z.enum(EU_COUNTRY_CODES, {
    errorMap: () => ({ message: "Please select an EU country" }),
  }),
  role: z.enum(["freelancer", "client"]),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy policy" }),
  }),
  termsConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms of service" }),
  }),
  marketingConsent: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// ── Freelancer Profile ───────────────────────────────────────

export const freelancerProfileSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  bio: z.string().max(2000).optional(),
  hourlyRate: z.number().min(10).max(500).optional(),
  availability: z.enum(["available", "busy", "unavailable"]),
  skills: z.array(z.string()).min(1, "Add at least one skill").max(15),
  languages: z.array(z.string()).min(1, "Add at least one language"),
});

// ── Project ──────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(300),
  description: z.string().min(50, "Please provide a detailed description").max(5000),
  category: z.string().min(1, "Please select a category"),
  budgetType: z.enum(["fixed", "hourly"]),
  budgetMin: z.number().min(100, "Minimum budget is €100"),
  budgetMax: z.number().min(100),
  skillsRequired: z.array(z.string()).min(1).max(10),
  deadline: z.string().optional(),
  visibility: z.enum(["public", "invite_only"]).default("public"),
});

// ── Proposal ─────────────────────────────────────────────────

export const submitProposalSchema = z.object({
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters").max(3000),
  proposedPrice: z.number().min(100, "Minimum bid is €100"),
  estimatedDays: z.number().min(1, "Minimum 1 day").max(365),
});

// ── Contract & Milestones ────────────────────────────────────

export const createContractSchema = z.object({
  proposalId: z.string().uuid(),
  agreedPrice: z.number().min(100),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3).max(300),
        description: z.string().optional(),
        amount: z.number().min(10),
        dueDate: z.string().optional(),
      })
    )
    .min(1, "At least one milestone is required"),
});

// ── Dispute ──────────────────────────────────────────────────

export const openDisputeSchema = z.object({
  milestoneId: z.string().uuid().optional(),
  reason: z.string().min(1, "Please select a reason"),
  description: z.string().min(20, "Please describe the issue in detail").max(3000),
});

// ── Types ────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type OpenDisputeInput = z.infer<typeof openDisputeSchema>;
