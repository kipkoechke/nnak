"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import {
  useAcceptTransfer,
  useBranchReceivedTransfers,
  useRejectTransfer,
  useTransferMember,
} from "@/hooks/use-invites";
import { MdAdd, MdClose, MdSwapHoriz } from "react-icons/md";
import type { BranchTransfer } from "@/types/nnak";

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function BranchTransfersPage() {
  const [status, setStatus] = useState("pending");
  const { data: transfers = [], isLoading } = useBranchReceivedTransfers({
    status,
  });
  const accept = useAcceptTransfer();
  const reject = useRejectTransfer();
  const request = useTransferMember();

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      toast.error("Member user ID is required");
      return;
    }
    const r = await request
      .mutateAsync({
        user_id: userId.trim(),
        message: message.trim() || undefined,
      })
      .catch(() => null);
    if (r) {
      setOpen(false);
      setUserId("");
      setMessage("");
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Member Transfers"
        description="Incoming transfer requests for your branch"
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90"
          >
            <MdAdd className="w-4 h-4" /> Request Transfer
          </button>
        }
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

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : transfers.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            <MdSwapHoriz className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No {status} transfers.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">From Branch</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2 w-44"></th>
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
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-xs truncate">
                    {t.message || "—"}
                  </td>
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
                  <td className="px-3 py-2">
                    {t.status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => reject.mutate(t.id)}
                          disabled={reject.isPending || accept.isPending}
                          className="text-[11px] px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => accept.mutate(t.id)}
                          disabled={accept.isPending || reject.isPending}
                          className="text-[11px] px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </td>
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
                Transfer Member to This Branch
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
                Member User ID <span className="text-red-500">*</span>
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="uuid-of-member"
                required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                placeholder="Requesting transfer of this nurse to our branch"
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
                disabled={request.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {request.isPending ? "Sending…" : "Request Transfer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
