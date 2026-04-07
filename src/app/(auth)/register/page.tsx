"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" }, { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" }, { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" }, { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" }, { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" }, { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    role: "" as "freelancer" | "client" | "",
    countryCode: "",
    gdprConsent: false,
    marketingConsent: false,
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setFieldErrors({});

    // Client-side validation
    if (!form.role) {
      setFormError("Please select whether you want to hire or work as a freelancer");
      setLoading(false);
      return;
    }
    if (!form.countryCode) {
      setFormError("Please select your country");
      setLoading(false);
      return;
    }
    if (!form.gdprConsent) {
      setFormError("You must accept the Terms and Privacy Policy to create an account");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gdprConsent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        setFormError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but sign-in failed — redirect to login
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "linkedin") {
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-midnight font-serif mb-1">Create your account</h3>
      <p className="text-[13px] text-midnight-300 mb-6">
        Already have an account?{" "}
        <Link href="/login" className="text-honey font-semibold hover:underline">Log in</Link>
      </p>

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <button
          onClick={() => handleOAuth("google")}
          type="button"
          className="flex-1 py-2.5 rounded-xl border border-cream-200 bg-white text-[13px] font-semibold text-midnight hover:border-honey/30 transition-colors"
        >
          🔵 Google
        </button>
        <button
          onClick={() => handleOAuth("linkedin")}
          type="button"
          className="flex-1 py-2.5 rounded-xl border border-cream-200 bg-white text-[13px] font-semibold text-midnight hover:border-honey/30 transition-colors"
        >
          🔗 LinkedIn
        </button>
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-cream-200" />
        <span className="text-xs text-midnight-200">or</span>
        <div className="flex-1 h-px bg-cream-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-midnight mb-1">First name</label>
            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Marcus" className="input" required />
            {fieldErrors.firstName && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.firstName[0]}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-midnight mb-1">Last name</label>
            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Hoffmann" className="input" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.eu" className="input" required autoComplete="email" />
          {fieldErrors.email && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.email[0]}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters, 1 uppercase, 1 number" className="input" required autoComplete="new-password" minLength={8} />
          {fieldErrors.password && <p className="text-xs text-red-500 mt-0.5">{fieldErrors.password[0]}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">Country</label>
          <select value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)} className="input" required>
            <option value="">Select your country</option>
            {EU_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-midnight mb-1">I want to</label>
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.role === "client" ? "border-honey bg-honey/5" : "border-cream-200 hover:border-honey/30"}`}>
              <input type="radio" name="role" value="client" checked={form.role === "client"} onChange={() => update("role", "client")} className="accent-honey" />
              <div>
                <div className="text-sm font-semibold text-midnight">Hire freelancers</div>
                <div className="text-[10px] text-midnight-300">Post projects & manage contracts</div>
              </div>
            </label>
            <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${form.role === "freelancer" ? "border-honey bg-honey/5" : "border-cream-200 hover:border-honey/30"}`}>
              <input type="radio" name="role" value="freelancer" checked={form.role === "freelancer"} onChange={() => update("role", "freelancer")} className="accent-honey" />
              <div>
                <div className="text-sm font-semibold text-midnight">Work as freelancer</div>
                <div className="text-[10px] text-midnight-300">Find projects & get paid</div>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2 text-xs text-midnight-300 pt-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.gdprConsent} onChange={(e) => update("gdprConsent", e.target.checked)} className="mt-0.5 accent-honey" />
            <span>I agree to the <Link href="/terms" className="text-honey underline">Terms of Service</Link> and <Link href="/privacy" className="text-honey underline">Privacy Policy</Link>, and consent to data processing as described (GDPR Art. 6)</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.marketingConsent} onChange={(e) => update("marketingConsent", e.target.checked)} className="mt-0.5 accent-honey" />
            <span>I agree to receive product updates and tips (optional, withdraw anytime)</span>
          </label>
        </div>

        <Button fullWidth size="lg" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-[10px] text-midnight-200 pt-1">
          🔒 Your data is stored in the EU (Scaleway) · GDPR compliant
        </p>
      </form>
    </div>
  );
}
