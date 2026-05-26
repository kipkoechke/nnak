"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useMember, useSetMemberStatus } from "@/hooks/nnak/use-members";
import { useCategories } from "@/hooks/nnak/use-categories";
import { useNnakBranches } from "@/hooks/nnak/use-branches";
import { useStkPush } from "@/hooks/nnak/use-payments";
import DigitalIdCard from "./DigitalIdCard";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: member, isLoading } = useMember(id);
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches();
  const setStatusM = useSetMemberStatus();
  const stk = useStkPush();

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (!member) return <div className="p-4 text-sm text-slate-500">Member not found</div>;

  const category = cats.find((c) => c.id === member.profile.member_category_id);
  const branch = branches.find((b) => b.id === member.profile.branch_id);

  const collectAnnual = () => {
    if (!category) return;
    stk.mutate({
      user_id: member.id,
      amount: category.annual_fee,
      purpose: "subscription",
      phone: member.profile.phone || "+254700000000",
    });
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title={member.name}
        description={`Member ${member.profile.account_number}`}
        back={() => router.back()}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Email" value={member.email} />
            <Field label="Phone" value={member.profile.phone} />
            <Field label="NCK #" value={member.profile.nck_number} />
            <Field label="National ID" value={member.profile.identification_number} />
            <Field label="Category" value={category?.name} />
            <Field label="Branch" value={branch?.name} />
            <Field label="Status" value={member.profile.status} />
            <Field label="Subscription expires" value={member.profile.subscription_expires_at ? new Date(member.profile.subscription_expires_at).toLocaleDateString() : "—"} />
          </div>
          <div className="pt-3 flex gap-2 flex-wrap">
            {member.profile.status === "pending" && (
              <button onClick={() => setStatusM.mutate({ id, status: "active", reason: "approved" })} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded">Approve</button>
            )}
            {member.profile.status === "active" && (
              <button onClick={() => setStatusM.mutate({ id, status: "suspended" })} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Suspend</button>
            )}
            {category && (
              <button onClick={collectAnnual} disabled={stk.isPending} className="bg-primary text-white text-xs px-3 py-1.5 rounded">
                {stk.isPending ? "Processing..." : `Collect KES ${category.annual_fee} (M-Pesa)`}
              </button>
            )}
          </div>
        </div>
        <DigitalIdCard member={member} category={category?.name} />
      </div>
    </div>
  );
}

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <div className="text-[11px] uppercase text-slate-500">{label}</div>
    <div className="text-sm text-slate-800">{value || "—"}</div>
  </div>
);
