"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MdPerson } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import {
  useMemberDetail,
  useSetMemberStatus,
  useConvertStudent,
  useToggleExecutive,
} from "@/hooks/use-members";
import { useBranchMember } from "@/hooks/use-branch-manager";
import { useCategories } from "@/hooks/use-categories";
import { useNnakMe } from "@/hooks/use-auth";
import { useNnakBranches, useReinstateBranchMember } from "@/hooks/use-branches";
import { useStkPush } from "@/hooks/use-payments";
import { ModalShell } from "@/components/common/Modal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import DigitalIdCard from "./DigitalIdCard";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: me } = useNnakMe();
  const isBranchManager = me?.role === "branch" || me?.role === "branch_manager";

  const adminDetail = useMemberDetail(id, { enabled: !isBranchManager });
  const branchMember = useBranchMember(isBranchManager ? id : undefined);
  const member = isBranchManager
    ? branchMember.data
    : adminDetail.data?.member;
  const isLoading = isBranchManager
    ? branchMember.isLoading
    : adminDetail.isLoading;
  const contributions = adminDetail.data?.contributions;
  const pendingInvoices = adminDetail.data?.pending_invoices ?? [];

  const { data: cats = [] } = useCategories();
  const setStatusM = useSetMemberStatus();
  const convertStudent = useConvertStudent();
  const stk = useStkPush();
  const toggleExecutive = useToggleExecutive();
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  // Admin-only, and only members can hold the flag. `/admin/members/{id}`
  // does not send `is_executive` today, so a missing value reads as off
  // rather than hiding the control.
  const isAdmin = me?.role === "super_admin" || me?.role === "admin";
  const canToggleExecutive = isAdmin && member?.role === "member";
  const isExecutive = member?.is_executive === true;

  // A member with no branch can be put back into one; the API emails them.
  const reinstate = useReinstateBranchMember();
  const [showReinstate, setShowReinstate] = useState(false);
  const [reinstateBranch, setReinstateBranch] = useState("");
  const { data: branches = [] } = useNnakBranches({
    enabled: !isBranchManager && showReinstate,
  });

  const submitReinstate = async () => {
    if (!reinstateBranch) return;
    const ok = await reinstate
      .mutateAsync({ branchId: reinstateBranch, userId: id })
      .then(() => true)
      .catch(() => false);
    if (ok) {
      setShowReinstate(false);
      setReinstateBranch("");
    }
  };

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!member) return <div className="p-4 text-sm text-slate-500">Member not found</div>;

  const category = cats.find((c) => c.id === member.profile?.member_category_id);
  const branchName = member.profile?.branch?.name;
  // The card and this panel both print coverage, not the older expiry field.
  const coverageEnd =
    member.profile?.coverage_end_date ??
    member.current_coverage_end_date ??
    member.profile?.subscription_expires_at ??
    null;

  const collectAnnual = () => {
    if (!category) return;
    stk.mutate({
      user_id: member.id,
      amount: category.annual_fee,
      purpose: "subscription",
      phone: member.profile?.phone || "+254700000000",
    });
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title={member.name} description={`Member ${member.profile?.membership_number || member.profile?.account_number || "—"}`} back={() => router.back()} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-16 h-16 rounded-lg bg-primary-subtle border-2 border-primary-muted overflow-hidden flex items-center justify-center shrink-0">
              {member.profile?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.profile.photo_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MdPerson className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">
                {member.name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {member.email || "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Membership Number" value={member.profile?.membership_number} />
            <Field label="Email" value={member.email} />
            <Field label="NCK Registration Number" value={member.profile?.nck_number} />
            <Field label="Phone" value={member.profile?.phone} />
            <Field label="National ID" value={member.profile?.identification_number} />
            <Field label="Designation" value={member.profile?.designation?.toUpperCase()} />
            <Field label="County" value={member.profile?.county} />
            <Field label="Gender" value={member.profile?.gender} />
            <Field label="Category" value={category?.name || member.profile?.member_category?.name} />
            <Field label="Branch" value={branchName} />
            <Field label="Status" value={member.profile?.status || "—"} />
            <Field label="Coverage ends" value={coverageEnd ? new Date(coverageEnd).toLocaleDateString() : "—"} />
          </div>
          {!isBranchManager && (
            <div className="pt-3 flex gap-2 flex-wrap">
              {member.profile?.status === "pending" && (
                <button onClick={() => setStatusM.mutate({ id, status: "active", reason: "approved" })} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded">Approve</button>
              )}
              {member.profile?.status === "active" && (
                <button onClick={() => setShowSuspendModal(true)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Suspend</button>
              )}
              {!member.profile?.branch_id && (
                <button
                  onClick={() => setShowReinstate(true)}
                  className="bg-slate-700 text-white text-xs px-3 py-1.5 rounded"
                >
                  Assign to branch
                </button>
              )}
              {member.role === "student" && (
                <button
                  onClick={() => {
                    if (confirm(`Convert ${member.name} from student to full member?`))
                      convertStudent.mutate(member.id);
                  }}
                  disabled={convertStudent.isPending}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
                >
                  {convertStudent.isPending ? "Converting…" : "Convert to Member"}
                </button>
              )}
              {category && (
                <button onClick={collectAnnual} disabled={stk.isPending} className="bg-primary text-white text-xs px-3 py-1.5 rounded">
                  {stk.isPending ? "Processing..." : `Collect KES ${category.annual_fee} (M-Pesa)`}
                </button>
              )}
            </div>
          )}

          {canToggleExecutive && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-700">
                  Executive privileges
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Grants a read-only association-wide dashboard. Membership is
                  unaffected.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isExecutive}
                aria-label="Executive privileges"
                disabled={toggleExecutive.isPending}
                onClick={() =>
                  toggleExecutive.mutate({ userId: member.id, detailId: id })
                }
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  isExecutive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isExecutive ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </div>
        {member.profile && (
          <DigitalIdCard
            member={{ ...member, profile: member.profile }}
            category={category?.name}
            validUntil={coverageEnd}
          />
        )}
      </div>

      {!isBranchManager && (
        <>
          {/* Contributions */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Contributions
              </h3>
              {contributions && (
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-500">
                    Lifetime paid{" "}
                    <span className="font-semibold text-emerald-600">
                      {money(contributions.lifetime_paid)}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    Pending{" "}
                    <span className="font-semibold text-amber-600">
                      {money(contributions.lifetime_pending)}
                    </span>
                  </span>
                </div>
              )}
            </div>
            {!contributions?.history.length ? (
              <p className="text-xs text-slate-500">
                No contributions recorded yet.
              </p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Method</th>
                      <th className="px-3 py-2 hidden md:table-cell">
                        Reference
                      </th>
                      <th className="px-3 py-2">Paid On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contributions.history.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {c.invoice_number || "—"}
                        </td>
                        <td className="px-3 py-2">{money(c.amount)}</td>
                        <td className="px-3 py-2 hidden sm:table-cell capitalize">
                          {c.payment_method?.replace(/_/g, " ") || "—"}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-slate-500">
                          {c.payment_reference || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {c.paid_at
                            ? new Date(c.paid_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending invoices */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Pending Invoices
            </h3>
            {!pendingInvoices.length ? (
              <p className="text-xs text-slate-500">No pending invoices.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Due</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {inv.invoice_number || "—"}
                        </td>
                        <td className="px-3 py-2">{money(inv.amount)}</td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                            {inv.status || "pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <ModalShell isOpen={showReinstate} onClose={() => setShowReinstate(false)}>
        <div className="p-5 space-y-4 w-full max-w-md">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Assign {member.name} to a branch
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              The member is reinstated to the branch and emailed about it.
            </p>
          </div>
          <select
            value={reinstateBranch}
            onChange={(e) => setReinstateBranch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Select a branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowReinstate(false)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={submitReinstate}
              disabled={!reinstateBranch || reinstate.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold disabled:opacity-50"
            >
              {reinstate.isPending ? "Assigning…" : "Assign"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell isOpen={showSuspendModal} onClose={() => setShowSuspendModal(false)}>
        <DeleteConfirmationModal
          itemName={member.name}
          itemType="member"
          title="Suspend Member"
          message={`Are you sure you want to suspend "${member.name}"?`}
          confirmLabel="Suspend"
          isDeleting={setStatusM.isPending}
          onConfirm={() => {
            setStatusM.mutate({ id, status: "suspended" });
            setShowSuspendModal(false);
          }}
        />
      </ModalShell>
    </div>
  );
}

const money = (n: number) =>
  `KES ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <div className="text-[11px] uppercase text-slate-500">{label}</div>
    <div className="text-sm text-slate-800">{value || "—"}</div>
  </div>
);
