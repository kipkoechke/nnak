"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import {
  useCreateSubscription,
  useMemberDashboardApi,
} from "@/hooks/use-subscriptions";
import { useInvoiceStkPush, useInvoiceStkQuery } from "@/hooks/use-member-payments";
import DigitalIdCard, {
  downloadDigitalIdPdf,
} from "@/app/nnak/(app)/members/[id]/DigitalIdCard";
import { MdDownload } from "react-icons/md";
import type { MemberStatus, NnakProfile, NnakUser } from "@/types/nnak";

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

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value}</dd>
  </div>
);

export default function MyMembershipPage() {
  const { data: me } = useNnakMe();
  const { data: dash } = useMemberDashboardApi();
  const subscribe = useCreateSubscription();
  const stkPush = useInvoiceStkPush();
  const [stkPhone, setStkPhone] = useState("");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const stkQuery = useInvoiceStkQuery(activeInvoiceId);

  if (!me) {
    return <div className="px-4 py-6 text-sm text-slate-500">Loading membership…</div>;
  }
  const profile = me.profile;
  if (!profile) {
    return <div className="px-4 py-6 text-sm text-slate-500">Setting up your membership…</div>;
  }

  const effectiveMember: NnakUser & { profile: NnakProfile } = { ...me, profile };
  const apiSub = dash?.subscription ?? null;
  const isStudent = me.role === "student";

  const subAmount = apiSub ? Number(apiSub.amount) : 0;
  const subExpiry = apiSub?.end_date ?? profile.subscription_expires_at ?? null;
  const expiresIn = daysUntil(subExpiry);
  const restricted = expiresIn !== null && expiresIn < -30;

  const apiStatus = dash?.subscription_status;
  const status: MemberStatus =
    apiStatus === "active"
      ? "active"
      : apiStatus === "pending_payment"
        ? "pending"
        : apiStatus === "expired" || apiStatus === "cancelled"
          ? "inactive"
          : ((profile.status || "pending") as MemberStatus);

  const accountNumber = dash?.account_number || profile.account_number;
  const categoryLabel =
    apiSub?.member_category?.name || profile.employer_type || "—";

  const onRenew = () => subscribe.mutate({});

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="My Membership"
        action={
          !isStudent ? (
            <div className="flex items-center gap-3">
              {apiSub && (
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-slate-500">
                    {apiSub.member_category.name} · KES {subAmount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    expires {fmtDate(subExpiry)}
                  </div>
                </div>
              )}
              <button
                onClick={onRenew}
                disabled={subscribe.isPending}
                className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
              >
                {subscribe.isPending ? "..." : apiSub ? "Renew" : "Subscribe"}
              </button>
            </div>
          ) : undefined
        }
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
            <DigitalIdCard
              member={effectiveMember}
              category={categoryLabel}
              showDownload={false}
            />
          )}

          {!restricted && (
            <button
              onClick={() => downloadDigitalIdPdf(effectiveMember)}
              className="w-[344px] inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-600 hover:text-primary py-2"
            >
              <MdDownload className="w-3.5 h-3.5" />
              Download digital ID (PDF)
            </button>
          )}
        </div>

        {/* Details column */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">{effectiveMember.name}</div>
                <div className="text-xs text-slate-500">{effectiveMember.email}</div>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[status]}`}>
                {status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Account number" value={accountNumber} />
              <Item label="NCK License Number" value={profile.nck_number || "—"} />
              <Item label="National ID" value={profile.identification_number || "—"} />
              <Item label="Phone" value={profile.phone || "—"} />
              <Item label="Gender" value={profile.gender || "—"} />
              <Item label="Designation" value={profile.designation || "—"} />
              <Item label="Verification" value={profile.is_verified ? "Verified" : "Pending"} />
              <Item label="Member since" value={fmtDate(profile.created_at)} />
              <Item
                label="Subscription valid until"
                value={
                  <span>
                    {fmtDate(subExpiry)}
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

          {expiresIn !== null && expiresIn <= 60 && expiresIn >= 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3">
              Renewal reminder: your subscription expires in {expiresIn} days.
            </div>
          )}

          {apiSub?.invoice && !apiSub.invoice.status && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm space-y-3">
              <div>
                <div className="font-semibold">
                  Invoice {apiSub.invoice.invoice_number} — KES {Number(apiSub.invoice.amount).toLocaleString()}
                </div>
                <div className="text-xs opacity-80">
                  Issued {fmtDate(apiSub.invoice.issue_date)} · Due {fmtDate(apiSub.invoice.due_date)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  placeholder={profile.phone || "254700000000"}
                  className="px-3 py-2 border border-amber-300 rounded-md text-sm bg-white w-full sm:w-48"
                />
                <button
                  onClick={() => {
                    const phone = stkPhone || profile.phone || "";
                    if (!phone) return;
                    stkPush.mutate(
                      { invoiceId: apiSub.invoice!.id, body: { phone_number: phone } },
                      { onSuccess: (data) => { setStkPhone(""); setActiveInvoiceId(data.invoice_id); } },
                    );
                  }}
                  disabled={stkPush.isPending}
                  className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {stkPush.isPending ? "Sending..." : "Pay via M-Pesa"}
                </button>
                {activeInvoiceId && (
                  <button
                    onClick={() => stkQuery.refetch()}
                    disabled={stkQuery.isFetching}
                    className="bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-amber-800 disabled:opacity-50 whitespace-nowrap"
                  >
                    {stkQuery.isFetching ? "Checking..." : "Check Status"}
                  </button>
                )}
              </div>

              {stkPush.isSuccess && !stkQuery.data && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
                  STK Push sent. Check your phone and enter your M-Pesa PIN, then click &ldquo;Check Status&rdquo;.
                </div>
              )}

              {stkQuery.data && (
                <div className={`text-xs rounded-md px-3 py-1.5 border ${
                  stkQuery.data.status === "successful" || stkQuery.data.status === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  Status: <span className="font-semibold">{stkQuery.data.status}</span>
                  {stkQuery.data.checkout_request_id && (
                    <> · Ref: {stkQuery.data.checkout_request_id}</>
                  )}
                </div>
              )}

              {stkPush.isError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
                  {(stkPush.error as { response?: { data?: { message?: string } } })?.response?.data?.message || "STK Push failed. Try again."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
