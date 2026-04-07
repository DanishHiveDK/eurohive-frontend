"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ContractDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isClient = session?.user?.id === contract?.clientId;

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/v1/contracts/${id}`);
      setContract(await res.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function milestoneAction(milestoneId: string, action: "fund" | "submit" | "approve") {
    setActionLoading(milestoneId);
    try {
      const res = await fetch(`/api/v1/milestones/${milestoneId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (action === "fund" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      // Reload contract
      const updated = await fetch(`/api/v1/contracts/${id}`);
      setContract(await updated.json());
    } catch (e: any) {
      alert("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <Loading />;
  if (!contract) return <div className="text-center py-20 text-midnight-300">Contract not found</div>;

  const otherParty = isClient
    ? `${contract.freelancer?.firstName} ${contract.freelancer?.lastName}`
    : `${contract.client?.firstName} ${contract.client?.lastName}`;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/contracts" className="text-sm text-midnight-300 hover:text-honey">← Back to contracts</Link>
      </div>

      {/* Contract Header */}
      <div className="bg-white rounded-xl border border-cream-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-serif text-midnight">{contract.project?.title}</h1>
            <p className="text-sm text-midnight-300 mt-1">Contract with {otherParty}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-serif text-midnight">€{Number(contract.agreedPrice).toLocaleString()}</p>
            <StatusBadge status={contract.status} />
          </div>
        </div>
        <div className="flex gap-4 text-xs text-midnight-300">
          <span>Started: {new Date(contract.startedAt).toLocaleDateString()}</span>
          <span>Fee: {Number(contract.platformFeePct)}%</span>
          {contract.completedAt && <span>Completed: {new Date(contract.completedAt).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-cream-200">
        <div className="px-5 py-4 border-b border-cream-200">
          <h2 className="font-semibold font-serif text-midnight">Milestones</h2>
        </div>
        {!contract.milestones?.length ? (
          <div className="py-10 text-center text-sm text-midnight-300">No milestones defined yet</div>
        ) : (
          <div className="divide-y divide-cream-100">
            {contract.milestones.sort((a: any, b: any) => a.position - b.position).map((m: any) => (
              <div key={m.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-cream-100 text-midnight-300 px-2 py-0.5 rounded-full font-mono">#{m.position}</span>
                      <h3 className="font-medium text-midnight text-sm">{m.title}</h3>
                    </div>
                    {m.description && <p className="text-xs text-midnight-300 mt-1">{m.description}</p>}
                    {m.dueDate && <p className="text-xs text-midnight-200 mt-1">Due: {new Date(m.dueDate).toLocaleDateString()}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-midnight">€{Number(m.amount).toLocaleString()}</p>
                    <StatusBadge status={m.status} />
                  </div>
                </div>

                {/* Actions based on status + role */}
                <div className="flex gap-2 mt-3">
                  {isClient && m.status === "pending" && (
                    <Button size="sm" onClick={() => milestoneAction(m.id, "fund")} disabled={actionLoading === m.id}>
                      {actionLoading === m.id ? "Processing..." : "Fund Escrow"}
                    </Button>
                  )}
                  {!isClient && (m.status === "funded" || m.status === "in_progress") && (
                    <Button size="sm" onClick={() => milestoneAction(m.id, "submit")} disabled={actionLoading === m.id}>
                      {actionLoading === m.id ? "Submitting..." : "Submit for Review"}
                    </Button>
                  )}
                  {isClient && m.status === "submitted" && (
                    <Button size="sm" onClick={() => milestoneAction(m.id, "approve")} disabled={actionLoading === m.id}>
                      {actionLoading === m.id ? "Approving..." : "Approve & Release Payment"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
