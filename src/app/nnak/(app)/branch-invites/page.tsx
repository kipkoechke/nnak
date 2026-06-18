"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAdminBranchInvites } from "@/hooks/use-invites";
import { useNnakBranches } from "@/hooks/use-branches";
import type { BranchInvite } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
};

export default function AdminBranchInvitesPage() {
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const { data: branches = [] } = useNnakBranches();
  const { data: invites = [], isLoading } = useAdminBranchInvites({
    status: status || undefined,
    branch_id: branchId || undefined,
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branch Member Invites"
        description="All invites sent by branches to existing members"
      />

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Branch
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            No invites match the filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Invited By</th>
                <th className="px-3 py-2">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invites.map((inv: BranchInvite) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">
                      {inv.member?.name || "—"}
                    </div>
                    {inv.member?.membership_number && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.member.membership_number}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{inv.branch?.name || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                        STATUS_TONE[inv.status] || STATUS_TONE.pending
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {inv.invited_by?.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmt(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
