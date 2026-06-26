"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useFinanceMember } from "@/hooks/use-finance";

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value || "—"}</dd>
  </div>
);

export default function FinanceMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: member, isLoading } = useFinanceMember(id);

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading member…</div>;
  if (!member)
    return <div className="p-4 text-sm text-slate-500">Member not found.</div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={member.name}
        description={member.email}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
              member.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {member.is_active ? "Active" : "Inactive"}
          </span>
        }
      />

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Profile
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Item label="Membership No." value={member.membership_number} />
          <Item label="Membership Type" value={member.membership_type} />
          <Item label="Chapter" value={member.chapter} />
          <Item label="Designation" value={member.designation} />
          <Item label="NCK Number" value={member.nck_number} />
          <Item label="Branch" value={member.branch_name} />
        </dl>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Subscription
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Item
            label="Last Sub. End"
            value={fmtDate(member.last_subscription_end)}
          />
          <Item
            label="Aging (months)"
            value={
              member.aging_months != null ? (
                <span
                  className={`font-semibold ${
                    member.aging_months >= 12
                      ? "text-red-600"
                      : member.aging_months >= 6
                        ? "text-amber-600"
                        : "text-emerald-700"
                  }`}
                >
                  {member.aging_months} months
                </span>
              ) : (
                "N/A"
              )
            }
          />
          <Item label="Joined" value={fmtDate(member.created_at)} />
        </dl>
      </div>
    </div>
  );
}
