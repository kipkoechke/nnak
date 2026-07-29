"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
  useBranch,
  useAdminBranchMembers,
  useChangeBranchManager,
  useRemoveBranchMember,
} from "@/hooks/use-branches";
import { ModalShell } from "@/components/common/Modal";
import { MdClose, MdPersonRemove, MdSwapHoriz } from "react-icons/md";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: branch, isLoading } = useBranch(id);
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { data: membersData, isLoading: membersLoading } = useAdminBranchMembers(
    showChangeManager ? id : undefined,
  );
  const changeManager = useChangeBranchManager();
  const managerCandidates = membersData?.data ?? [];

  // Removing a member detaches them from the branch and emails them the
  // reason, so it is confirmed and the reason is required.
  const removeMember = useRemoveBranchMember();
  const [removeFor, setRemoveFor] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [removeReason, setRemoveReason] = useState("");

  const submitRemove = async () => {
    if (!removeFor || !removeReason.trim()) return;
    const ok = await removeMember
      .mutateAsync({
        branchId: id,
        userId: removeFor.userId,
        reason: removeReason.trim(),
      })
      .then(() => true)
      .catch(() => false);
    if (ok) {
      setRemoveFor(null);
      setRemoveReason("");
    }
  };

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await changeManager.mutateAsync({ branchId: id, userId: selectedUserId }).catch(() => null);
    setShowChangeManager(false);
    setSelectedUserId("");
  };

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!branch)
    return <div className="p-4 text-sm text-slate-500">Branch not found</div>;

  const members = branch.members ?? [];

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={branch.name}
        description={branch.employer_type_label || branch.employer_type || undefined}
        back={() => router.back()}
        action={
          <button
            onClick={() => setShowChangeManager(true)}
            className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 text-xs font-medium px-3 py-2 rounded-md hover:bg-amber-50"
          >
            <MdSwapHoriz className="w-4 h-4" />
            Change Manager
          </button>
        }
      />

      {/* Commission + Manager info strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Commission Type</div>
          <div className="font-medium">{branch.commission_type_label || branch.commission_type || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Commission Rate</div>
          <div className="font-medium">{branch.commission_value ? `${branch.commission_value}%` : "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Members</div>
          <div className="font-medium">{(branch.members_count ?? branch.members?.length ?? 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Manager</div>
          <div className="font-medium">{branch.manager?.name || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Manager Email</div>
          <div className="text-xs text-slate-600">{branch.manager?.email || "—"}</div>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
          Members ({members.length})
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">No members in this branch.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Membership No</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2 hidden md:table-cell">Chapter of Interest</th>
                <th className="px-3 py-2 hidden md:table-cell">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Pending (KES)</th>
                <th className="px-3 py-2 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{m.membership_number || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{m.name || "—"}</div>
                    {m.email && <div className="text-xs text-slate-500">{m.email}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs">{m.designation?.toUpperCase() || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 hidden md:table-cell">{m.chapter_label || "—"}</td>
                  <td className="px-3 py-2 text-xs hidden md:table-cell">{m.member_category?.name || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                        m.is_approved
                          ? m.subscription_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.is_approved ? (m.subscription_active ? "Active" : "Approved") : "Pending"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {m.pending_invoices_total
                      ? `KES ${Number(m.pending_invoices_total).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() =>
                        setRemoveFor({
                          userId: m.user_id,
                          name: m.name || "this member",
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-red-600 font-medium hover:underline"
                    >
                      <MdPersonRemove className="w-4 h-4" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Change Manager modal */}
      {showChangeManager && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleChangeManager}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Change Branch Manager</h3>
                <p className="text-xs text-slate-500 mt-0.5">{branch.name}</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select New Manager <span className="text-red-500">*</span>
              </label>
              {membersLoading ? (
                <div className="text-xs text-slate-400 py-2">Loading branch members…</div>
              ) : managerCandidates.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No members found in this branch.</div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">— select a member —</option>
                  {managerCandidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.email ? `(${m.email})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowChangeManager(false); setSelectedUserId(""); }}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUserId || changeManager.isPending}
                className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {changeManager.isPending ? "Changing…" : "Confirm Change"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalShell
        isOpen={!!removeFor}
        onClose={() => {
          setRemoveFor(null);
          setRemoveReason("");
        }}
      >
        <div className="p-5 space-y-4 w-full max-w-md">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Remove {removeFor?.name} from {branch.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              They become an individual member and are emailed the reason
              below. An admin can reinstate them to a branch later.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              rows={3}
              placeholder="e.g. Left the institution"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRemoveFor(null);
                setRemoveReason("");
              }}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitRemove}
              disabled={!removeReason.trim() || removeMember.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {removeMember.isPending ? "Removing…" : "Remove member"}
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
