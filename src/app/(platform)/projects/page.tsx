"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { PageHeader, EmptyState, Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ status: "open", limit: "20" });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const res = await fetch(`/api/v1/projects?${params}`);
      const data = await res.json();
      setProjects(data.data || []);
      setLoading(false);
    }
    load();
  }, [search, category]);

  const isClient = session?.user?.role === "client";

  return (
    <div>
      <PageHeader
        title="Projects"
        description={isClient ? "Manage your posted projects" : "Find your next opportunity"}
        actions={isClient ? <Link href="/projects/new"><Button>+ Post a Project</Button></Link> : undefined}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search projects..."
          className="input flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
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

      {loading ? (
        <Loading />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No projects found"
          description="Try adjusting your search or check back later."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <div className="bg-white rounded-xl border border-cream-200 p-5 hover:shadow-sm hover:border-cream-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-midnight font-serif">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-midnight-300 line-clamp-2 mb-3">{p.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-midnight">€{Number(p.budgetMin).toLocaleString()} – €{Number(p.budgetMax).toLocaleString()}</span>
                    <span className="text-xs text-midnight-200">•</span>
                    <span className="text-xs text-midnight-300 capitalize">{p.budgetType}</span>
                    {p.deadline && (
                      <>
                        <span className="text-xs text-midnight-200">•</span>
                        <span className="text-xs text-midnight-300">Due {new Date(p.deadline).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-midnight-300">{p.proposalCount || 0} proposals</span>
                </div>
                {p.skillsRequired?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.skillsRequired.map((s: string) => (
                      <span key={s} className="text-xs bg-cream-50 text-midnight-400 px-2 py-0.5 rounded-full border border-cream-200">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
