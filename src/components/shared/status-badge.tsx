const statusColors: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  funded: "bg-amber-50 text-amber-700 border-amber-200",
  submitted: "bg-purple-50 text-purple-700 border-purple-200",
  pending: "bg-slate-50 text-slate-600 border-slate-200",
  pending_kyc: "bg-slate-50 text-slate-600 border-slate-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  shortlisted: "bg-cyan-50 text-cyan-700 border-cyan-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-600 border-red-200",
  withdrawn: "bg-slate-50 text-slate-500 border-slate-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  disputed: "bg-red-50 text-red-600 border-red-200",
  revision: "bg-orange-50 text-orange-700 border-orange-200",
  busy: "bg-amber-50 text-amber-700 border-amber-200",
  unavailable: "bg-red-50 text-red-600 border-red-200",
  suspended: "bg-red-50 text-red-600 border-red-200",
  banned: "bg-red-50 text-red-600 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
