"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
  useMemberDetail,
  useSetMemberStatus,
  useConvertStudent,
} from "@/hooks/use-members";
import { useBranchMember } from "@/hooks/use-branch-manager";
import { useCategories } from "@/hooks/use-categories";
import { useNnakMe } from "@/hooks/use-auth";
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
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!member) return <div className="p-4 text-sm text-slate-500">Member not found</div>;

  const category = cats.find((c) => c.id === member.profile?.member_category_id);
  const branchName = member.profile?.branch?.name;

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
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
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
            <Field label="Subscription expires" value={member.profile?.subscription_expires_at ? new Date(member.profile.subscription_expires_at).toLocaleDateString() : "—"} />
          </div>
          {!isBranchManager && (
            <div className="pt-3 flex gap-2 flex-wrap">
              {member.profile?.status === "pending" && (
                <button onClick={() => setStatusM.mutate({ id, status: "active", reason: "approved" })} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded">Approve</button>
              )}
              {member.profile?.status === "active" && (
                <button onClick={() => setShowSuspendModal(true)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Suspend</button>
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
        </div>
        {member.profile && (
          <DigitalIdCard member={{ ...member, profile: member.profile }} category={category?.name} />
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
