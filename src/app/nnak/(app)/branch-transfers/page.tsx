"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAdminBranchTransfers } from "@/hooks/use-invites";
import { useNnakBranches } from "@/hooks/use-branches";
import type { BranchTransfer } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
};

export default function AdminBranchTransfersPage() {
  const [status, setStatus] = useState("");
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const { data: branches = [] } = useNnakBranches();
  const { data: transfers = [], isLoading } = useAdminBranchTransfers({
    status: status || undefined,
    from_branch_id: fromBranchId || undefined,
    to_branch_id: toBranchId || undefined,
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Member Transfers"
        description="All inter-branch transfer requests"
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
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">From</label>
          <select
            value={fromBranchId}
            onChange={(e) => setFromBranchId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Any branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">To</label>
          <select
            value={toBranchId}
            onChange={(e) => setToBranchId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Any branch</option>
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
        ) : transfers.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            No transfers match the filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t: BranchTransfer) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">
                      {t.member?.name || "—"}
                    </div>
                    {t.member?.membership_number && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        {t.member.membership_number}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{t.from_branch?.name || "—"}</td>
                  <td className="px-3 py-2">{t.to_branch?.name || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                        STATUS_TONE[t.status] || STATUS_TONE.pending
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{fmt(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
