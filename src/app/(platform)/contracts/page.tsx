"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PageHeader, EmptyState, Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const role = session?.user?.role === "freelancer" ? "freelancer" : "client";
      const res = await fetch(`/api/v1/contracts?role=${role}`);
      const data = await res.json();
      setContracts(data.data || []);
      setLoading(false);
    }
    if (session) load();
  }, [session]);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Contracts" description="Your active and past contracts" />

      {contracts.length === 0 ? (
        <EmptyState icon="📋" title="No contracts yet" description="Contracts are created when you accept a proposal." />
      ) : (
        <div className="space-y-3">
          {contracts.map((c: any) => (
            <Link key={c.id} href={`/contracts/${c.id}`} className="block bg-white rounded-xl border border-cream-200 p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-midnight text-sm">{c.project?.title || "Untitled project"}</h3>
                  <p className="text-xs text-midnight-300 mt-1">
                    with {session?.user?.role === "client" ? `${c.freelancer?.firstName} ${c.freelancer?.lastName}` : `${c.client?.firstName} ${c.client?.lastName}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-midnight">€{Number(c.agreedPrice).toLocaleString()}</p>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              {c.milestones && (
                <div className="mt-3 flex gap-1">
                  {c.milestones.map((m: any) => (
                    <div key={m.id} className={`h-1.5 flex-1 rounded-full ${
                      m.status === "approved" ? "bg-emerald-400" :
                      m.status === "submitted" ? "bg-purple-400" :
                      m.status === "funded" || m.status === "in_progress" ? "bg-amber-400" :
                      "bg-cream-200"
                    }`} title={`${m.title}: ${m.status}`} />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
