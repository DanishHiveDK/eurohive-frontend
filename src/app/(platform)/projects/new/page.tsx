"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/shared";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "web-development",
    budgetType: "fixed" as "fixed" | "hourly",
    budgetMin: "",
    budgetMax: "",
    skillsRequired: "",
    deadline: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budgetMin: parseFloat(form.budgetMin),
          budgetMax: parseFloat(form.budgetMax),
          skillsRequired: form.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean),
          deadline: form.deadline || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const data = await res.json();
      router.push(`/projects/${data.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Post a Project" description="Describe your project to find the right freelancer" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-cream-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-midnight mb-1">Project title</label>
            <input className="input" placeholder="e.g. Build a Next.js e-commerce platform" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-midnight mb-1">Description</label>
            <textarea className="input min-h-[150px]" placeholder="Describe your project in detail — scope, requirements, deliverables..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="design">Design</option>
                <option value="data-science">Data Science</option>
                <option value="devops">DevOps</option>
                <option value="marketing">Marketing</option>
                <option value="writing">Writing</option>
                <option value="consulting">Consulting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Budget type</label>
              <select className="input" value={form.budgetType} onChange={(e) => setForm({ ...form, budgetType: e.target.value as any })}>
                <option value="fixed">Fixed price</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Budget min (€)</label>
              <input className="input" type="number" min="50" placeholder="500" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Budget max (€)</label>
              <input className="input" type="number" min="50" placeholder="2000" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-midnight mb-1">Required skills</label>
            <input className="input" placeholder="React, TypeScript, PostgreSQL" value={form.skillsRequired} onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })} />
            <p className="text-xs text-midnight-200 mt-1">Comma-separated</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-midnight mb-1">Deadline (optional)</label>
            <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button fullWidth size="lg" type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
