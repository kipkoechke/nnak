"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
  useBranch,
  useAdminBranchMembers,
  useChangeBranchManager,
} from "@/hooks/use-branches";
import { MdClose, MdSwapHoriz } from "react-icons/md";

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
      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Commission Type</div>
          <div className="font-medium">{branch.commission_type_label || branch.commission_type || "—"}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Commission Rate</div>
          <div className="font-medium">{branch.commission_value ? `${branch.commission_value}%` : "—"}</div>
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
                <th className="px-3 py-2">Account No</th>
                <th className="px-3 py-2">Membership No</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2">Chapter</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Pending (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{m.account_number || "—"}</td>
                  <td className="px-3 py-2 text-xs">{m.membership_number || "—"}</td>
                  <td className="px-3 py-2">{m.designation || "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{m.chapter_label || "—"}</td>
                  <td className="px-3 py-2 text-xs">{m.member_category?.name || "—"}</td>
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
                      ? Number(m.pending_invoices_total).toLocaleString()
                      : "—"}
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
    </div>
  );
}
