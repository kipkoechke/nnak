"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import {
  useCreateSubscription,
  useMemberDashboardApi,
} from "@/hooks/use-subscriptions";
import {
  useInvoiceStkPush,
  useInvoiceStkQuery,
} from "@/hooks/use-member-payments";
import { nqk } from "@/lib/query-keys";
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
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// How long Safaricom keeps the STK prompt alive on the handset (~60s). Used
// only for the on-screen countdown — polling continues until a terminal status.
const STK_TIMEOUT_SECONDS = 60;

// Normalise any Kenyan number entry to Safaricom MSISDN form (2547XXXXXXXX /
// 2541XXXXXXXX) regardless of how it was typed: +254…, 0…, or a bare 7…/1….
const normalizeKenyaMsisdn = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
};

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value}</dd>
  </div>
);

export default function MyMembershipPage() {
  const qc = useQueryClient();
  const { data: me } = useNnakMe();
  const { data: dash } = useMemberDashboardApi();
  const subscribe = useCreateSubscription();
  const stkPush = useInvoiceStkPush();
  const [stkPhone, setStkPhone] = useState(me?.profile?.phone || "");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(STK_TIMEOUT_SECONDS);

  const isTerminal = (s?: string | null) =>
    !!s &&
    ["successful", "success", "failed", "cancelled", "timeout"].includes(
      String(s).toLowerCase(),
    );

  const stkQuery = useInvoiceStkQuery(activeInvoiceId, {
    enabled: !!activeInvoiceId,
    refetchInterval: (data) => {
      const s = data?.status?.toLowerCase();
      return isTerminal(s) ? false : 3000;
    },
  });

  const stkStatus = stkQuery.data?.status?.toLowerCase();
  const isSuccess = stkStatus === "successful" || stkStatus === "success";
  const isFailed =
    stkStatus === "failed" ||
    stkStatus === "cancelled" ||
    stkStatus === "timeout";

  // On success: refresh member dashboard so digital ID unlocks, then close.
  useEffect(() => {
    if (!isSuccess) return;
    qc.invalidateQueries({ queryKey: nqk.memberDashboard });
    qc.invalidateQueries({ queryKey: nqk.auth.me });
    const t = setTimeout(() => {
      setShowPayModal(false);
      setActiveInvoiceId(null);
      setPaymentError(null);
    }, 1500);
    return () => clearTimeout(t);
  }, [isSuccess, qc]);

  // Countdown for the STK prompt: restarts whenever a new push is initiated,
  // ticks down while we wait, and stops once the status resolves.
  const isWaiting = !!activeInvoiceId && !isSuccess && !isFailed;
  useEffect(() => {
    if (!activeInvoiceId) return;
    setCountdown(STK_TIMEOUT_SECONDS);
  }, [activeInvoiceId]);
  useEffect(() => {
    if (!isWaiting) return;
    const t = setInterval(
      () => setCountdown((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(t);
  }, [isWaiting]);

  // On failure: surface the reason and re-enable the Pay button.
  useEffect(() => {
    if (!isFailed) return;
    const reason =
      stkQuery.data?.ResultDesc ||
      stkQuery.data?.message ||
      (stkStatus === "cancelled"
        ? "You cancelled the payment on your phone."
        : stkStatus === "timeout"
          ? "The payment prompt timed out before you completed it."
          : "Payment was not completed.");
    setPaymentError(reason);
    setActiveInvoiceId(null);
    stkPush.reset();
  }, [isFailed, stkQuery.data, stkStatus, stkPush]);

  if (!me) {
    return (
      <div className="px-4 py-6 text-sm text-slate-500">
        Loading membership…
      </div>
    );
  }
  const profile = me.profile;
  if (!profile) {
    return (
      <div className="px-4 py-6 text-sm text-slate-500">
        Setting up your membership…
      </div>
    );
  }

  const effectiveMember: NnakUser & { profile: NnakProfile } = {
    ...me,
    profile,
  };
  const isStudent = me.role === "student";

  // Authoritative subscription lifecycle from GET /profile:
  //  • current_subscription  — the paid term covering today
  //  • pending_subscription  — a future-dated extension awaiting payment
  //  • coverage_active       — is the member active *right now* (independent of
  //    any pending extension). Falls back to the dashboard shape for older APIs.
  const currentSub =
    me.current_subscription ?? dash?.current_subscription ?? dash?.subscription ?? null;
  const pendingSub = me.pending_subscription ?? dash?.pending_subscription ?? null;
  const apiStatus = me.subscription_status ?? dash?.subscription_status;
  const coverageActive =
    me.coverage_active ?? dash?.coverage_active ?? apiStatus === "active";

  // The invoice the member can pay: the pending extension first, otherwise an
  // unpaid current-term invoice.
  const payableSub =
    pendingSub && pendingSub.invoice && !pendingSub.invoice.status
      ? pendingSub
      : currentSub && currentSub.invoice && !currentSub.invoice.status
        ? currentSub
        : null;
  const payableInvoice = payableSub?.invoice ?? null;
  const canPay = !!payableInvoice && !payableInvoice.status;

  // What to show in the "active membership" summary — the current term if we
  // have one, else whatever is payable.
  const displaySub = currentSub ?? payableSub;
  const subAmount = displaySub ? Number(displaySub.amount) : 0;

  const subExpiry =
    me.current_coverage_end_date ??
    me.subscription_ends_on ??
    dash?.current_coverage_end_date ??
    dash?.subscription_ends_on ??
    currentSub?.end_date ??
    profile.subscription_expires_at ??
    null;
  const expiresIn = daysUntil(subExpiry);

  // A pending extension awaiting payment stacks on top of current coverage.
  const extendsTo =
    pendingSub && pendingSub.invoice && !pendingSub.invoice.status
      ? (pendingSub.end_date ?? null)
      : null;

  const restricted = !coverageActive;
  const status: MemberStatus = coverageActive
    ? "active"
    : apiStatus === "pending_payment"
      ? "pending"
      : apiStatus === "expired" || apiStatus === "cancelled"
        ? "inactive"
        : ((profile.status || "pending") as MemberStatus);

  const accountNumber = dash?.account_number || profile.account_number;
  const categoryLabel =
    displaySub?.member_category?.name || profile.employer_type || "—";

  // With active coverage a new subscription extends (stacks onto) the current
  // expiry rather than replacing it — so the CTA reads "Extend".
  const hasActiveInterval = coverageActive;
  const renewLabel = hasActiveInterval
    ? "Extend"
    : displaySub
      ? "Renew"
      : "Subscribe";

  const onRenew = () => subscribe.mutate({});

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="My Membership"
        action={
          !isStudent ? (
            <div className="flex items-center gap-3">
              {displaySub && (
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-slate-500">
                    {displaySub.member_category.name} · KES{" "}
                    {subAmount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    expires {fmtDate(subExpiry)}
                  </div>
                </div>
              )}
              {canPay ? (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-emerald-700 whitespace-nowrap"
                >
                  Pay now
                </button>
              ) : (
                <button
                  onClick={onRenew}
                  disabled={subscribe.isPending}
                  title={
                    hasActiveInterval
                      ? `Adds another term on top of your current expiry (${fmtDate(subExpiry)})`
                      : undefined
                  }
                  className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                >
                  {subscribe.isPending ? "..." : renewLabel}
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        {/* Digital ID Card column */}
        <div className="space-y-3">
          {restricted ? (
            <div className="w-[344px] h-[216px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <div className="text-sm font-semibold text-slate-700">
                Digital ID unavailable
              </div>
              <div className="text-xs text-slate-500 mt-1">
                An active subscription is required to access your digital ID.
                {apiStatus === "pending_payment"
                  ? " Complete your payment to unlock."
                  : " Renew your membership to continue."}
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
                <div className="text-lg font-semibold text-slate-900">
                  {effectiveMember.name}
                </div>
                <div className="text-xs text-slate-500">
                  {effectiveMember.email}
                </div>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[status]}`}
              >
                {status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item
                label="Membership Number"
                value={profile.membership_number || "—"}
              />
              <Item label="Account number" value={accountNumber} />
              <Item
                label="NCK Registration Number"
                value={profile.nck_number || "—"}
              />
              <Item
                label="National ID"
                value={profile.identification_number || "—"}
              />
              <Item label="Phone" value={profile.phone || "—"} />
              <Item label="Gender" value={profile.gender || "—"} />
              <Item label="Designation" value={profile.designation || "—"} />
              <Item
                label="NCK Verification"
                value={profile.is_verified ? "Verified" : "Pending"}
              />
              <Item label="Member since" value={fmtDate(profile.created_at)} />
              <Item
                label="Subscription valid until"
                value={
                  <span>
                    {fmtDate(subExpiry)}
                    {expiresIn !== null && (
                      <span
                        className={`ml-2 text-[11px] ${expiresIn < 0 ? "text-red-600" : expiresIn <= 60 ? "text-amber-600" : "text-slate-400"}`}
                      >
                        (
                        {expiresIn < 0
                          ? `${Math.abs(expiresIn)} days overdue`
                          : `${expiresIn} days left`}
                        )
                      </span>
                    )}
                    {extendsTo && (
                      <span className="block text-[11px] text-amber-600 mt-0.5">
                        Extension to {fmtDate(extendsTo)} pending payment
                      </span>
                    )}
                  </span>
                }
              />
            </dl>
          </div>

          {expiresIn !== null && expiresIn <= 60 && expiresIn >= 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3">
              Renewal reminder: your subscription expires in {expiresIn} days. You
              can extend now — the new term is added on top of your current expiry
              ({fmtDate(subExpiry)}), so you don&apos;t lose any remaining days.
            </div>
          )}
        </div>
      </div>

      {showPayModal && payableInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Pay Invoice
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice</span>
                <span className="font-mono font-semibold">
                  {payableInvoice.invoice_number}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold">
                  KES {Number(payableInvoice.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Due</span>
                <span>{fmtDate(payableInvoice.due_date)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                placeholder="07XX XXX XXX or 2547XXXXXXXX"
                disabled={isWaiting}
                className="w-full h-[46px] px-3 rounded-lg border border-gray-300 bg-white text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary disabled:bg-slate-50"
              />
              {stkPhone.trim() && (
                <p className="text-[11px] text-slate-500 mt-1">
                  We&apos;ll prompt {normalizeKenyaMsisdn(stkPhone)}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const phone = normalizeKenyaMsisdn(stkPhone || profile.phone || "");
                if (!phone) return;
                setPaymentError(null);
                stkPush.mutate(
                  {
                    invoiceId: payableInvoice.id,
                    body: { phone_number: phone },
                  },
                  {
                    onSuccess: (data) => {
                      setActiveInvoiceId(data.invoice_id);
                    },
                  },
                );
              }}
              disabled={
                stkPush.isPending ||
                (!!activeInvoiceId && !isFailed && !isSuccess)
              }
              className="w-full bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {stkPush.isPending
                ? "Sending..."
                : isWaiting
                  ? "Waiting for confirmation…"
                  : paymentError
                    ? "Retry Payment"
                    : "Pay via M-Pesa"}
            </button>

            {isWaiting && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0" />
                {countdown > 0 ? (
                  <span>
                    STK Push sent. Enter your M-Pesa PIN on your phone — we&apos;ll
                    confirm automatically.{" "}
                    <span className="font-semibold tabular-nums">
                      ({countdown}s)
                    </span>
                  </span>
                ) : (
                  <span>
                    Still processing — this is taking longer than usual. We&apos;ll
                    update automatically once M-Pesa responds.
                  </span>
                )}
              </div>
            )}

            {isSuccess && (
              <div className="text-xs rounded-md px-3 py-2 text-center font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                Payment successful! Refreshing your membership…
              </div>
            )}

            {paymentError && !activeInvoiceId && (
              <div className="text-xs rounded-md px-3 py-2 bg-red-50 border border-red-200 text-red-700">
                <div className="font-semibold mb-0.5">Payment failed</div>
                <div className="text-red-700/90">{paymentError}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
