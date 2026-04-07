"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PageHeader, Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: "", proposedPrice: "", estimatedDays: "" });

  const isFreelancer = session?.user?.role === "freelancer";
  const isOwner = project?.clientId === session?.user?.id;

  useEffect(() => {
    async function load() {
      const [projRes, propRes] = await Promise.all([
        fetch(`/api/v1/projects/${id}`),
        fetch(`/api/v1/projects/${id}/proposals`),
      ]);
      setProject(await projRes.json());
      const propData = await propRes.json();
      setProposals(propData.data || []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function submitProposal(e: React.FormEvent) {
    e.preventDefault();
    setProposalLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter: proposal.coverLetter,
          proposedPrice: parseFloat(proposal.proposedPrice),
          estimatedDays: parseInt(proposal.estimatedDays),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setProposals([data, ...proposals]);
      setShowProposalForm(false);
      setProposal({ coverLetter: "", proposedPrice: "", estimatedDays: "" });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProposalLoading(false);
    }
  }

  async function acceptProposal(proposalId: string) {
    if (!confirm("Accept this proposal and create a contract?")) return;
    try {
      const res = await fetch(`/api/v1/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const contract = await res.json();
      router.push(`/contracts/${contract.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <Loading />;
  if (!project) return <div className="text-center py-20 text-midnight-300">Project not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-midnight-300 hover:text-honey">← Back to projects</Link>
      </div>

      {/* Project Card */}
      <div className="bg-white rounded-xl border border-cream-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-serif text-midnight">{project.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.status} />
              <span className="text-sm text-midnight-300 capitalize">{project.category?.replace(/-/g, " ")}</span>
              <span className="text-xs text-midnight-200">•</span>
              <span className="text-sm text-midnight-300">Posted {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-serif text-midnight">€{Number(project.budgetMin).toLocaleString()} – €{Number(project.budgetMax).toLocaleString()}</p>
            <p className="text-xs text-midnight-300 capitalize">{project.budgetType} price</p>
          </div>
        </div>

        <div className="prose prose-sm text-midnight-400 mb-4 whitespace-pre-wrap">{project.description}</div>

        {project.skillsRequired?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.skillsRequired.map((s: string) => (
              <span key={s} className="text-xs bg-cream-50 text-midnight-400 px-2.5 py-1 rounded-full border border-cream-200">{s}</span>
            ))}
          </div>
        )}

        {project.deadline && (
          <p className="text-sm text-midnight-300">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
        )}
      </div>

      {/* Proposal Form (Freelancer) */}
      {isFreelancer && project.status === "open" && !showProposalForm && (
        <Button fullWidth onClick={() => setShowProposalForm(true)} className="mb-6">Submit a Proposal</Button>
      )}

      {showProposalForm && (
        <form onSubmit={submitProposal} className="bg-white rounded-xl border border-honey/30 p-6 mb-6 space-y-4">
          <h3 className="font-semibold font-serif text-midnight">Your Proposal</h3>
          <div>
            <label className="block text-sm font-semibold text-midnight mb-1">Cover letter</label>
            <textarea className="input min-h-[120px]" placeholder="Explain why you're the right fit for this project..." value={proposal.coverLetter} onChange={(e) => setProposal({ ...proposal, coverLetter: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Your price (€)</label>
              <input className="input" type="number" min="1" placeholder="1500" value={proposal.proposedPrice} onChange={(e) => setProposal({ ...proposal, proposedPrice: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-midnight mb-1">Estimated days</label>
              <input className="input" type="number" min="1" placeholder="14" value={proposal.estimatedDays} onChange={(e) => setProposal({ ...proposal, estimatedDays: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => setShowProposalForm(false)}>Cancel</Button>
            <Button fullWidth type="submit" disabled={proposalLoading}>{proposalLoading ? "Submitting..." : "Submit Proposal"}</Button>
          </div>
        </form>
      )}

      {/* Proposals List */}
      <div className="bg-white rounded-xl border border-cream-200">
        <div className="px-5 py-4 border-b border-cream-200">
          <h2 className="font-semibold font-serif text-midnight">Proposals ({proposals.length})</h2>
        </div>
        {proposals.length === 0 ? (
          <div className="py-10 text-center text-sm text-midnight-300">No proposals yet</div>
        ) : (
          <div className="divide-y divide-cream-100">
            {proposals.map((p: any) => (
              <div key={p.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-midnight text-sm">{p.freelancer?.firstName} {p.freelancer?.lastName}</p>
                    <p className="text-xs text-midnight-300">{p.freelancer?.freelancerProfile?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-midnight">€{Number(p.proposedPrice).toLocaleString()}</p>
                    <p className="text-xs text-midnight-300">{p.estimatedDays} days</p>
                  </div>
                </div>
                <p className="text-sm text-midnight-400 mb-3">{p.coverLetter}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {isOwner && p.status === "pending" && (
                    <Button size="sm" onClick={() => acceptProposal(p.id)}>Accept & Create Contract</Button>
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
