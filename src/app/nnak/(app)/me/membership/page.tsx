"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import { useMember } from "@/hooks/use-members";
import { useCategories } from "@/hooks/use-categories";
import { useNnakBranches } from "@/hooks/use-branches";
import { useStkPush } from "@/hooks/use-payments";
import DigitalIdCard from "@/app/nnak/(app)/members/[id]/DigitalIdCard";
import type { MemberStatus } from "@/types/nnak";

const STATUS_TONE: Record<MemberStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-slate-200 text-slate-700",
  archived: "bg-slate-200 text-slate-500",
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export default function MyMembershipPage() {
  const { data: me } = useNnakMe();
  const { data: member, isLoading } = useMember(me?.id ?? "");
  const { data: cats = [] } = useCategories();
  const { data: branches = [] } = useNnakBranches();
  const stk = useStkPush();
  const [phone, setPhone] = useState("");

  if (isLoading || !me || !member) {
    return <div className="px-4 py-6 text-sm text-slate-500">Loading membership…</div>;
  }

  const cat = cats.find((c) => c.id === member.profile.member_category_id);
  const branch = branches.find((b) => b.id === member.profile.branch_id);
  const status = (member.profile.status || "pending") as MemberStatus;
  const expiresIn = daysUntil(member.profile.subscription_expires_at);
  const isStudent = me.role === "student";
  const fee = cat ? (cat.billing_frequency === "monthly" ? cat.monthly_fee ?? 0 : cat.annual_fee) : 0;
  const restricted = expiresIn !== null && expiresIn < -30; // FR-MP-017

  const pay = async () => {
    if (!phone || !fee) return;
    await stk.mutateAsync({
      user_id: me.id,
      amount: fee,
      purpose: "subscription",
      phone,
    });
    setPhone("");
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="My Membership"
        description="Your NNAK digital membership and subscription status (FR-MP-009, FR-MP-013)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        {/* Digital ID Card column */}
        <div className="space-y-3">
          {restricted ? (
            <div className="w-[344px] h-[216px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <div className="text-sm font-semibold text-slate-700">ID download restricted</div>
              <div className="text-xs text-slate-500 mt-1">
                Subscription is more than 30 days overdue. Renew to restore your digital ID.
              </div>
            </div>
          ) : (
            <DigitalIdCard member={member} category={cat?.name} />
          )}
        </div>

        {/* Details column */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Member</div>
                <div className="text-lg font-semibold text-slate-900">{member.name}</div>
                <div className="text-xs text-slate-500">{member.email}</div>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[status]}`}>
                {status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Account number" value={member.profile.account_number} />
              <Item label="NCK number" value={member.profile.nck_number || "—"} />
              <Item label="National ID" value={member.profile.identification_number || "—"} />
              <Item label="Phone" value={member.profile.phone || "—"} />
              <Item label="Category" value={cat?.name || "—"} />
              <Item label="Branch" value={branch?.name || "—"} />
              <Item label="Employer" value={member.profile.employer_name || (isStudent ? "Student" : "—")} />
              <Item label="County" value={member.profile.county || "—"} />
              <Item label="Member since" value={fmtDate(member.profile.joined_at)} />
              <Item
                label="Subscription valid until"
                value={
                  <span>
                    {fmtDate(member.profile.subscription_expires_at)}
                    {expiresIn !== null && (
                      <span className={`ml-2 text-[11px] ${expiresIn < 0 ? "text-red-600" : expiresIn <= 60 ? "text-amber-600" : "text-slate-400"}`}>
                        ({expiresIn < 0 ? `${Math.abs(expiresIn)}d overdue` : `${expiresIn}d left`})
                      </span>
                    )}
                  </span>
                }
              />
            </dl>
          </div>

          {/* Renewal / pay panel */}
          {!isStudent && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-slate-900">
                {expiresIn !== null && expiresIn < 60 ? "Renew subscription" : "Pay subscription"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 mb-3">
                {cat ? `${cat.name} — KES ${fee.toLocaleString()} ${cat.billing_frequency === "annual" ? "/ year" : "/ month"}` : "No category assigned"}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="M-Pesa phone (e.g. 0712345678)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
                <button
                  onClick={pay}
                  disabled={!phone || !fee || stk.isPending}
                  className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {stk.isPending ? "Sending STK…" : `Pay KES ${fee.toLocaleString()}`}
                </button>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                FR-MP-006 · M-Pesa STK push (mock). Receipt is emailed and added to your payment history on confirmation.
              </div>
            </div>
          )}

          {expiresIn !== null && expiresIn <= 60 && expiresIn >= 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3">
              Renewal reminder: your subscription expires in {expiresIn} days (FR-MP-012).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value}</dd>
  </div>
);
