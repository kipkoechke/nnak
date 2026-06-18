"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import {
  useBranchSentInvites,
  useInviteMember,
} from "@/hooks/use-invites";
import { MdAdd, MdClose, MdMailOutline } from "react-icons/md";
import type { BranchInvite } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600",
};

export default function BranchInvitesPage() {
  const [status, setStatus] = useState("pending");
  const { data: invites = [], isLoading } = useBranchSentInvites({ status });
  const invite = useInviteMember();
  const [open, setOpen] = useState(false);
  const [membershipNumber, setMembershipNumber] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipNumber.trim()) {
      toast.error("Membership number is required");
      return;
    }
    const r = await invite
      .mutateAsync({
        membership_number: membershipNumber.trim(),
        message: message.trim() || undefined,
      })
      .catch(() => null);
    if (r) {
      setOpen(false);
      setMembershipNumber("");
      setMessage("");
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branch Invites"
        description="Invite existing members to join your branch"
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
          >
            <MdAdd className="w-4 h-4" /> Invite Member
          </button>
        }
      />

      <div className="flex items-center gap-2">
        {(["pending", "accepted", "rejected", "expired"] as const).map((s) => (
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

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            <MdMailOutline className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No {status} invites.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2">Status</th>
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
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-md truncate">
                    {inv.message || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                        STATUS_TONE[inv.status] || STATUS_TONE.pending
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{fmt(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Invite Member to Branch
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Membership Number <span className="text-red-500">*</span>
              </label>
              <input
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                placeholder="e.g. NNAK/026/2000"
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="We'd love to have you at Nairobi Branch"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={invite.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {invite.isPending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
