"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdBadge,
  MdPayments,
  MdArrowForward,
  MdWorkOutline,
} from "react-icons/md";
import { useNnakMe } from "@/hooks/use-auth";
import { useMemberDashboardApi } from "@/hooks/use-subscriptions";
import {
  useInvoiceStkPush,
  useInvoiceStkQuery,
} from "@/hooks/use-member-payments";
import { useMyWorkstations } from "@/hooks/use-workstations";
import { isIndividualMember } from "@/lib/rbac";
import { PhoneInputField } from "@/components/common/PhoneInputField";

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
};

export default function MemberDashboard() {
  const { data: me } = useNnakMe();
  const { data: apiDash } = useMemberDashboardApi();
  const { data: workstations = [] } = useMyWorkstations();
  const stkPush = useInvoiceStkPush();
  const [stkPhone, setStkPhone] = useState(me?.profile?.phone || "");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const stkQuery = useInvoiceStkQuery(activeInvoiceId);
  const [showPayModal, setShowPayModal] = useState(false);

  // Auto-close payment modal when status check returns success
  useEffect(() => {
    if (
      stkQuery.data &&
      (stkQuery.data.status === "successful" ||
        stkQuery.data.status === "success")
    ) {
      const timer = setTimeout(() => {
        setShowPayModal(false);
        setActiveInvoiceId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stkQuery.data]);

  if (!me)
    return <div className="text-sm text-slate-500">Loading your portal…</div>;
  const profile = me.profile;
  // Only individual members pay their own subscription.
  const canSelfPay = isIndividualMember(me);

  // Profile-derived (no extra fetch): use employer_type from /profile as
  // the "category" label rather than calling /categories or /branches.
  const accountNumber = apiDash?.account_number || "—";

  // Authoritative subscription lifecycle from GET /member/dashboard:
  //  • current_subscription — paid term covering today
  //  • pending_subscription — future-dated extension awaiting payment
  //  • coverage_active      — is the member active right now
  const currentSub = apiDash?.current_subscription ?? null;
  const pendingSub = apiDash?.pending_subscription ?? null;
  const apiStatus = apiDash?.subscription_status;
  const coverageActive = apiDash?.coverage_active ?? false;

  const categoryLabel =
    currentSub?.member_category?.name || profile?.employer_type || "—";

  const apiExpiry =
    apiDash?.subscription_ends_on ??
    apiDash?.current_coverage_end_date ??
    currentSub?.end_date ??
    null;
  const expiresIn = daysUntil(apiExpiry);
  const extendsTo =
    pendingSub && pendingSub.invoice && !pendingSub.invoice.status
      ? (pendingSub.end_date ?? null)
      : null;

  const status = coverageActive
    ? "active"
    : apiStatus === "pending_payment"
      ? "pending"
      : apiStatus === "expired" || apiStatus === "cancelled"
        ? "inactive"
        : profile?.status || "pending";

  const currentWorkstation = workstations[0];
  // Invoice the member can pay — pending extension first, else unpaid current.
  const payableSub =
    pendingSub && pendingSub.invoice && !pendingSub.invoice.status
      ? pendingSub
      : currentSub && currentSub.invoice && !currentSub.invoice.status
        ? currentSub
        : null;
  const invoice = payableSub?.invoice;

  const statusTone =
    status === "active"
      ? "bg-emerald-100 text-emerald-800"
      : status === "pending"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm opacity-80">Welcome back,</div>
          <div className="text-xl font-semibold">{me.name}</div>
          <div className="text-[11px] opacity-80 mt-1">
            Member #{profile?.membership_number || accountNumber} ·{" "}
            {categoryLabel}
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}
          >
            {status}
          </span>
          {/* Payment CTAs are for individual members only; branch/corporate
              members are billed via their branch. */}
          {!canSelfPay ? null : invoice && !invoice.status ? (
            <button
              onClick={() => setShowPayModal(true)}
              className="inline-flex items-center gap-1.5 bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/95 shadow-sm"
            >
              Pay now <MdArrowForward className="w-3.5 h-3.5" />
            </button>
          ) : status !== "active" || (expiresIn !== null && expiresIn < 30) ? (
            <Link
              href="/nnak/me/membership"
              className="inline-flex items-center gap-1.5 bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/95 shadow-sm"
            >
              Renew My Membership <MdArrowForward className="w-3.5 h-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PortalCard
          href="/nnak/me/membership"
          icon={MdBadge}
          title="My Membership"
          primary={fmtDate(apiExpiry ?? profile?.subscription_expires_at)}
          subtitle={
            extendsTo
              ? `Extension to ${fmtDate(extendsTo)} pending payment`
              : expiresIn === null
                ? "No active subscription"
                : expiresIn < 0
                  ? `${Math.abs(expiresIn)} days overdue — renew now`
                  : `${expiresIn} days until renewal`
          }
          tone={
            expiresIn !== null && expiresIn < 0
              ? "danger"
              : expiresIn !== null && expiresIn <= 60
                ? "warn"
                : "ok"
          }
        />
        <PortalCard
          href="/nnak/me/subscriptions"
          icon={MdPayments}
          title="Subscriptions & Invoices"
          primary={
            invoice && !invoice.status
              ? `KES ${Number(invoice.pending_amount ?? invoice.amount).toLocaleString()} due`
              : currentSub
                ? `KES ${Number(currentSub.amount).toLocaleString()}`
                : "—"
          }
          subtitle={
            invoice
              ? `${invoice.invoice_number} · ${invoice.status ? "Paid" : "Unpaid"}`
              : "No active subscription"
          }
        />
        <PortalCard
          href="/nnak/me/workstations"
          icon={MdWorkOutline}
          title="Workstations"
          primary={
            currentWorkstation ? currentWorkstation.name : "None on file"
          }
          subtitle={
            currentWorkstation
              ? `${currentWorkstation.county}, ${currentWorkstation.country}`
              : "Add your current employer"
          }
        />
      </div>

      {/* Payment Modal */}
      {showPayModal && invoice && (
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
                  {invoice.invoice_number}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Amount</span>
                <span className="font-semibold">
                  KES {Number(invoice.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600">Due</span>
                <span>{fmtDate(invoice.due_date)}</span>
              </div>
            </div>

            <div>
              <PhoneInputField
                label="M-Pesa Phone Number"
                value={stkPhone || profile?.phone || ""}
                onChange={(val) => setStkPhone(val || "")}
                defaultCountry="KE"
              />
            </div>

            <button
              onClick={() => {
                const phone = stkPhone || profile?.phone || "";
                if (!phone) return;
                stkPush.mutate(
                  {
                    invoiceId: invoice.id,
                    body: { phone_number: phone.replace(/^\+/, "") },
                  },
                  {
                    onSuccess: (data) => {
                      setStkPhone("");
                      setActiveInvoiceId(data.invoice_id);
                    },
                  },
                );
              }}
              disabled={stkPush.isPending || (stkPush.isSuccess && stkQuery.data?.status !== "failed")}
              className="w-full bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {stkPush.isPending ? "Sending..." : "Pay via M-Pesa"}
            </button>

            {stkPush.isSuccess && !stkQuery.data && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-center">
                STK Push sent. Check your phone and enter your M-Pesa PIN.
              </div>
            )}

            {activeInvoiceId && (
              <button
                onClick={() => stkQuery.refetch()}
                disabled={stkQuery.isFetching}
                className="w-full border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                {stkQuery.isFetching ? "Checking..." : "Check Payment Status"}
              </button>
            )}

            {stkQuery.data && (
              <div
                className={`text-xs rounded-md px-3 py-2 text-center font-medium ${
                  stkQuery.data.status === "successful" ||
                  stkQuery.data.status === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {stkQuery.data.status === "successful" ||
                stkQuery.data.status === "success"
                  ? "Payment successful!"
                  : `Status: ${stkQuery.data.status}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PortalCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  primary: string;
  subtitle: string;
  tone?: "ok" | "warn" | "danger";
}

const PortalCard = ({
  href,
  icon: Icon,
  title,
  primary,
  subtitle,
  tone = "ok",
}: PortalCardProps) => {
  const toneCls =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white";
  return (
    <Link
      href={href}
      className={`block rounded-lg border ${toneCls} hover:border-primary hover:shadow-sm transition-all p-4`}
    >
      <div className="flex items-start justify-between">
        <Icon className="w-5 h-5 text-primary" />
        <MdArrowForward className="w-4 h-4 text-slate-400" />
      </div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mt-3">
        {title}
      </div>
      <div className="text-base font-semibold text-slate-900 mt-1 truncate">
        {primary}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
        {subtitle}
      </div>
    </Link>
  );
};
