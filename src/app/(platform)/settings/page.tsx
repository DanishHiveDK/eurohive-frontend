"use client";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/shared";

export default function SettingsPage() {
  const { data: session } = useSession();

  async function handleGdprExport() {
    if (!confirm("This will generate a full export of your personal data. Continue?")) return;
    alert("Data export request submitted. You'll receive an email when it's ready.");
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will permanently delete your account and all associated data. This cannot be undone.")) return;
    if (!confirm("Last chance — type your email to confirm deletion.")) return;
    alert("Account deletion request submitted. Your account will be deleted within 30 days per GDPR requirements.");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Manage your account" />

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-cream-200 p-6 mb-4">
        <h3 className="font-semibold font-serif text-midnight mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-midnight-300">Email</span>
            <span className="text-midnight">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-300">Role</span>
            <span className="text-midnight capitalize">{session?.user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-300">KYC Verified</span>
            <span className="text-midnight">{session?.user?.kycVerified ? "✓ Yes" : "Not yet"}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-cream-200 p-6 mb-4">
        <h3 className="font-semibold font-serif text-midnight mb-4">Notifications</h3>
        <div className="space-y-3">
          {["Email notifications", "Project updates", "Marketing emails"].map((label) => (
            <label key={label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-midnight">{label}</span>
              <input type="checkbox" defaultChecked={label !== "Marketing emails"} className="rounded border-cream-200 text-honey focus:ring-honey" />
            </label>
          ))}
        </div>
      </div>

      {/* GDPR */}
      <div className="bg-white rounded-xl border border-cream-200 p-6 mb-4">
        <h3 className="font-semibold font-serif text-midnight mb-2">Data & Privacy (GDPR)</h3>
        <p className="text-xs text-midnight-300 mb-4">Under GDPR, you have the right to access, export, and delete your personal data.</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleGdprExport}>Export My Data</Button>
          <Button variant="outline" size="sm" onClick={handleDeleteAccount} className="text-red-600 border-red-200 hover:bg-red-50">Delete Account</Button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-xl border border-cream-200 p-6">
        <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>Sign Out</Button>
      </div>
    </div>
  );
}
