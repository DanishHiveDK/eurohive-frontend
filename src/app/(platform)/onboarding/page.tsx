"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";

type Step = "role" | "profile" | "done";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "" as "freelancer" | "client" | "",
    firstName: "",
    lastName: "",
    countryCode: "",
    title: "",
    bio: "",
    hourlyRate: "",
    skills: "",
    companyName: "",
  });

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save");
      await update({ role: formData.role });
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const euCountries = [
    { code: "NL", name: "Netherlands" }, { code: "DE", name: "Germany" },
    { code: "FR", name: "France" }, { code: "SE", name: "Sweden" },
    { code: "DK", name: "Denmark" }, { code: "BE", name: "Belgium" },
    { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" }, { code: "PT", name: "Portugal" },
    { code: "AT", name: "Austria" }, { code: "FI", name: "Finland" },
    { code: "PL", name: "Poland" }, { code: "CZ", name: "Czechia" },
    { code: "RO", name: "Romania" }, { code: "GR", name: "Greece" },
    { code: "HU", name: "Hungary" }, { code: "BG", name: "Bulgaria" },
    { code: "HR", name: "Croatia" }, { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" }, { code: "LT", name: "Lithuania" },
    { code: "LV", name: "Latvia" }, { code: "EE", name: "Estonia" },
    { code: "LU", name: "Luxembourg" }, { code: "MT", name: "Malta" },
    { code: "CY", name: "Cyprus" },
  ];

  if (step === "done") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-serif font-bold text-midnight mb-2">Welcome to Eurohive!</h2>
        <p className="text-midnight-300">Setting up your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-honey/10 text-honey-600 rounded-full px-3 py-1 text-xs font-semibold mb-4">
          Step {step === "role" ? "1" : "2"} of 2
        </div>
        <h1 className="text-2xl font-serif font-bold text-midnight">
          {step === "role" ? "How will you use Eurohive?" : "Complete your profile"}
        </h1>
      </div>

      {step === "role" && (
        <div className="space-y-4">
          {[
            { value: "freelancer", icon: "💻", title: "I'm a freelancer", desc: "I want to find projects and earn money" },
            { value: "client", icon: "🏢", title: "I'm hiring", desc: "I want to find freelancers for my projects" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormData({ ...formData, role: opt.value as any })}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                formData.role === opt.value
                  ? "border-honey bg-honey/5 shadow-sm"
                  : "border-cream-200 bg-white hover:border-cream-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{opt.icon}</span>
                <div>
                  <p className="font-semibold text-midnight">{opt.title}</p>
                  <p className="text-sm text-midnight-300 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
          <Button fullWidth size="lg" disabled={!formData.role} onClick={() => setStep("profile")}>
            Continue
          </Button>
        </div>
      )}

      {step === "profile" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-midnight mb-1">First name</label>
              <input className="input" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-midnight mb-1">Last name</label>
              <input className="input" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-midnight mb-1">Country</label>
            <select className="input" value={formData.countryCode} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })} required>
              <option value="">Select your country</option>
              {euCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {formData.role === "freelancer" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-midnight mb-1">Professional title</label>
                <input className="input" placeholder="e.g. Senior React Developer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-midnight mb-1">Skills (comma-separated)</label>
                <input className="input" placeholder="React, TypeScript, Node.js" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-midnight mb-1">Hourly rate (€)</label>
                <input className="input" type="number" placeholder="75" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-midnight mb-1">Short bio</label>
                <textarea className="input min-h-[80px]" placeholder="Tell clients about yourself..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("role")}>Back</Button>
            <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading || !formData.firstName || !formData.lastName || !formData.countryCode}>
              {loading ? "Saving..." : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
