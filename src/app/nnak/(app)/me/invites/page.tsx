"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import {
  useAcceptInvite,
  useMyInvites,
  useRejectInvite,
} from "@/hooks/use-invites";
import { MdMailOutline, MdLocationOn } from "react-icons/md";
import type { BranchInvite } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
};

export default function MyInvitesPage() {
  const [status, setStatus] = useState("pending");
  const { data: invites = [], isLoading } = useMyInvites({ status });
  const accept = useAcceptInvite();
  const reject = useRejectInvite();

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Branch Invites"
        description="Branches that have invited you to join"
      />

      <div className="flex items-center gap-2">
        {(["pending", "accepted", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition ${
              status === s
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading invites…</div>
      ) : invites.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500">
          <MdMailOutline className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          No {status} invites.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {invites.map((inv: BranchInvite) => (
            <div
              key={inv.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {inv.branch?.name || "—"}
                  </div>
                  {inv.branch?.county && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MdLocationOn className="w-3 h-3" />
                      {inv.branch.county}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                    STATUS_TONE[inv.status] || STATUS_TONE.pending
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              {inv.message && (
                <blockquote className="text-xs text-slate-700 bg-slate-50 border-l-2 border-primary/40 px-3 py-2 rounded">
                  {inv.message}
                </blockquote>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Invited {fmt(inv.created_at)}</span>
                {inv.expires_at && <span>Expires {fmt(inv.expires_at)}</span>}
              </div>

              {inv.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => reject.mutate(inv.id)}
                    disabled={reject.isPending || accept.isPending}
                    className="flex-1 border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => accept.mutate(inv.id)}
                    disabled={accept.isPending || reject.isPending}
                    className="flex-1 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {accept.isPending ? "Accepting…" : "Accept"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
