"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { PageHeader, Loading } from "@/components/shared";
import { StatusBadge } from "@/components/shared/status-badge";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      setProfile(data);
      setForm(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setProfile(form);
      setEditing(false);
    } catch (e) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  const isFreelancer = session?.user?.role === "freelancer";

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="My Profile"
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
          )
        }
      />

      <div className="bg-white rounded-xl border border-cream-200 p-6 space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-honey/10 flex items-center justify-center text-2xl font-serif font-bold text-honey">
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </div>
          <div>
            {editing ? (
              <div className="flex gap-2">
                <input className="input text-sm" value={form.firstName || ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
                <input className="input text-sm" value={form.lastName || ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
              </div>
            ) : (
              <h2 className="text-lg font-bold font-serif text-midnight">{profile?.firstName} {profile?.lastName}</h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={profile?.status || "active"} />
              <span className="text-xs text-midnight-300 capitalize">{profile?.role}</span>
              <span className="text-xs text-midnight-200">•</span>
              <span className="text-xs text-midnight-300">{profile?.countryCode}</span>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-midnight-300 mb-1">Email</label>
          <p className="text-sm text-midnight">{profile?.email}</p>
        </div>

        {/* Freelancer fields */}
        {isFreelancer && profile?.freelancerProfile && (
          <>
            <div>
              <label className="block text-xs font-semibold text-midnight-300 mb-1">Title</label>
              {editing ? (
                <input className="input" value={form.freelancerProfile?.title || ""} onChange={(e) => setForm({ ...form, freelancerProfile: { ...form.freelancerProfile, title: e.target.value } })} />
              ) : (
                <p className="text-sm text-midnight">{profile.freelancerProfile.title}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-midnight-300 mb-1">Bio</label>
              {editing ? (
                <textarea className="input min-h-[80px]" value={form.freelancerProfile?.bio || ""} onChange={(e) => setForm({ ...form, freelancerProfile: { ...form.freelancerProfile, bio: e.target.value } })} />
              ) : (
                <p className="text-sm text-midnight-400">{profile.freelancerProfile.bio || "No bio added"}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-midnight-300 mb-1">Hourly rate</label>
              <p className="text-sm text-midnight">€{Number(profile.freelancerProfile.hourlyRate || 0).toLocaleString()}/hr</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-midnight-300 mb-1">Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {(profile.freelancerProfile.skills || []).map((s: string) => (
                  <span key={s} className="text-xs bg-cream-50 text-midnight-400 px-2.5 py-1 rounded-full border border-cream-200">{s}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-cream-200">
              <div className="text-center">
                <p className="text-lg font-bold font-serif text-midnight">{profile.freelancerProfile.completedProjects}</p>
                <p className="text-xs text-midnight-300">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-serif text-midnight">{Number(profile.freelancerProfile.ratingAvg).toFixed(1)}</p>
                <p className="text-xs text-midnight-300">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-serif text-midnight">€{Number(profile.freelancerProfile.totalEarned).toLocaleString()}</p>
                <p className="text-xs text-midnight-300">Earned</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
