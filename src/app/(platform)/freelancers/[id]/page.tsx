"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function FreelancerProfilePage() {
  const { id } = useParams();
  const [freelancer, setFreelancer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/v1/freelancers/${id}`);
      if (res.ok) setFreelancer(await res.json());
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Loading />;
  if (!freelancer) return <div className="text-center py-20 text-midnight-300">Freelancer not found</div>;

  const fp = freelancer.freelancerProfile;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/freelancers" className="text-sm text-midnight-300 hover:text-honey">← Back to freelancers</Link>
      </div>

      <div className="bg-white rounded-xl border border-cream-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-honey/10 flex items-center justify-center text-2xl font-serif font-bold text-honey">
            {freelancer.firstName?.[0]}{freelancer.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-midnight">{freelancer.firstName} {freelancer.lastName}</h1>
            <p className="text-sm text-midnight-300">{fp?.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={fp?.availability || "available"} />
              <span className="text-xs text-midnight-200">{freelancer.countryCode}</span>
              {fp?.hourlyRate && <span className="text-xs text-midnight-300">€{Number(fp.hourlyRate)}/hr</span>}
            </div>
          </div>
        </div>

        {fp?.bio && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-midnight mb-1">About</h3>
            <p className="text-sm text-midnight-400">{fp.bio}</p>
          </div>
        )}

        {fp?.skills?.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-midnight mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {fp.skills.map((s: string) => (
                <span key={s} className="text-xs bg-cream-50 text-midnight-400 px-2.5 py-1 rounded-full border border-cream-200">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-cream-200">
          <div className="text-center">
            <p className="text-lg font-bold font-serif text-midnight">{fp?.completedProjects || 0}</p>
            <p className="text-xs text-midnight-300">Projects</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-serif text-midnight">{Number(fp?.ratingAvg || 0).toFixed(1)} ⭐</p>
            <p className="text-xs text-midnight-300">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-serif text-midnight">€{Number(fp?.totalEarned || 0).toLocaleString()}</p>
            <p className="text-xs text-midnight-300">Earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
