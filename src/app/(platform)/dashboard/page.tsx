"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PageHeader, StatCard, EmptyState, Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isFreelancer = session?.user?.role === "freelancer";
  const isClient = session?.user?.role === "client";

  useEffect(() => {
    async function load() {
      try {
        // Fetch role-specific data
        if (isFreelancer) {
          const [projRes, contRes] = await Promise.all([
            fetch("/api/v1/projects?status=open&limit=5"),
            fetch("/api/v1/contracts?role=freelancer"),
          ]);
          const projects = await projRes.json();
          const contracts = await contRes.json();
          setItems(projects.data || []);
          setStats({
            activeContracts: (contracts.data || []).filter((c: any) => c.status === "active").length,
            totalEarned: "€0",
            openProjects: projects.total || 0,
            proposals: 0,
          });
        } else {
          const [projRes, contRes] = await Promise.all([
            fetch("/api/v1/projects?mine=true"),
            fetch("/api/v1/contracts?role=client"),
          ]);
          const projects = await projRes.json();
          const contracts = await contRes.json();
          setItems(projects.data || []);
          setStats({
            activeProjects: (projects.data || []).filter((p: any) => p.status === "open" || p.status === "in_progress").length,
            activeContracts: (contracts.data || []).filter((c: any) => c.status === "active").length,
            totalSpent: "€0",
            pendingProposals: 0,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (session) load();
  }, [session, isFreelancer, isClient]);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user?.name?.split(" ")[0] || "there"}`}
        description={isFreelancer ? "Find your next project" : "Manage your projects and team"}
        actions={
          isClient ? (
            <Link href="/projects/new">
              <Button>+ Post a Project</Button>
            </Link>
          ) : (
            <Link href="/projects">
              <Button>Browse Projects</Button>
            </Link>
          )
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isFreelancer ? (
          <>
            <StatCard label="Active Contracts" value={stats?.activeContracts || 0} icon="📋" />
            <StatCard label="Total Earned" value={stats?.totalEarned || "€0"} icon="💰" />
            <StatCard label="Open Projects" value={stats?.openProjects || 0} icon="🔍" />
            <StatCard label="My Proposals" value={stats?.proposals || 0} icon="📝" />
          </>
        ) : (
          <>
            <StatCard label="Active Projects" value={stats?.activeProjects || 0} icon="📁" />
            <StatCard label="Active Contracts" value={stats?.activeContracts || 0} icon="📋" />
            <StatCard label="Total Spent" value={stats?.totalSpent || "€0"} icon="💰" />
            <StatCard label="Pending Proposals" value={stats?.pendingProposals || 0} icon="📝" />
          </>
        )}
      </div>

      {/* Recent Items */}
      <div className="bg-white rounded-xl border border-cream-200">
        <div className="px-5 py-4 border-b border-cream-200">
          <h2 className="font-semibold font-serif text-midnight">
            {isFreelancer ? "Recent Open Projects" : "My Projects"}
          </h2>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon={isFreelancer ? "🔍" : "📁"}
            title={isFreelancer ? "No projects yet" : "No projects posted"}
            description={isFreelancer ? "New projects will appear here when clients post them." : "Post your first project to start finding talent."}
            action={
              isClient ? (
                <Link href="/projects/new"><Button>Post a Project</Button></Link>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-cream-100">
            {items.slice(0, 5).map((item: any) => (
              <Link key={item.id} href={`/projects/${item.id}`} className="block px-5 py-4 hover:bg-cream-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-midnight text-sm">{item.title}</h3>
                    <p className="text-xs text-midnight-300 mt-1 line-clamp-1">{item.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-midnight-300">€{Number(item.budgetMin).toLocaleString()} – €{Number(item.budgetMax).toLocaleString()}</span>
                      <StatusBadge status={item.status} />
                      {item.skillsRequired?.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-cream-100 text-midnight-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-midnight-200">{item.proposalCount || 0} proposals</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
