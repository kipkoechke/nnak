"use client";
import { useState } from "react";
import Link from "next/link";
import {
  MdBadge,
  MdPayments,
  MdArrowForward,
  MdWorkOutline,
} from "react-icons/md";
import { useNnakMe } from "@/hooks/use-auth";
import { useMemberDashboardApi } from "@/hooks/use-subscriptions";
import { useInvoiceStkPush, useInvoiceStkQuery } from "@/hooks/use-member-payments";
import { useMyWorkstations } from "@/hooks/use-workstations";

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
};

export default function MemberDashboard() {
  const { data: me } = useNnakMe();
  const { data: apiDash } = useMemberDashboardApi();
  const { data: workstations = [] } = useMyWorkstations();
  const stkPush = useInvoiceStkPush();
  const [stkPhone, setStkPhone] = useState("");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const stkQuery = useInvoiceStkQuery(activeInvoiceId);

  if (!me) return <div className="text-sm text-slate-500">Loading your portal…</div>;
  const profile = me.profile;

  // Profile-derived (no extra fetch): use employer_type from /profile as
  // the "category" label rather than calling /categories or /branches.
  const accountNumber = apiDash?.account_number || profile?.account_number || "—";
  const categoryLabel =
    apiDash?.subscription?.member_category?.name ||
    profile?.employer_type ||
    "—";

  const apiExpiry = apiDash?.subscription?.end_date ?? null;
  const expiresIn = apiExpiry
    ? daysUntil(apiExpiry)
    : daysUntil(profile?.subscription_expires_at);

  const apiStatus = apiDash?.subscription_status;
  const status =
    apiStatus === "active"
      ? "active"
      : apiStatus === "pending_payment"
        ? "pending"
        : apiStatus === "expired" || apiStatus === "cancelled"
          ? "inactive"
          : (profile?.status || "pending");

  const currentWorkstation = workstations[0];
  const invoice = apiDash?.subscription?.invoice;

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
            Member #{accountNumber} · {categoryLabel}
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}>
            {status}
          </span>
          {(status !== "active" || (expiresIn !== null && expiresIn < 30)) && (
            <Link
              href="/nnak/me/membership"
              className="inline-flex items-center gap-1.5 bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-white/95 shadow-sm"
            >
              Renew My Membership <MdArrowForward className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PortalCard
          href="/nnak/me/membership"
          icon={MdBadge}
          title="My Membership"
          primary={fmtDate(apiExpiry ?? profile?.subscription_expires_at)}
          subtitle={
            expiresIn === null
              ? "No active subscription"
              : expiresIn < 0
                ? `${Math.abs(expiresIn)}d overdue — renew now`
                : `${expiresIn}d until renewal`
          }
          tone={expiresIn !== null && expiresIn < 0 ? "danger" : expiresIn !== null && expiresIn <= 60 ? "warn" : "ok"}
        />
        <PortalCard
          href="/nnak/me/subscriptions"
          icon={MdPayments}
          title="Subscriptions & Invoices"
          primary={
            apiDash?.subscription
              ? `KES ${Number(apiDash.subscription.amount).toLocaleString()}`
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
          primary={currentWorkstation ? currentWorkstation.name : "None on file"}
          subtitle={
            currentWorkstation
              ? `${currentWorkstation.city}, ${currentWorkstation.country}`
              : "Add your current employer"
          }
        />
      </div>

      {invoice && !invoice.status && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">
                Invoice {invoice.invoice_number} —
                KES {Number(invoice.amount).toLocaleString()}
              </div>
              <div className="text-xs opacity-80">
                Due {fmtDate(invoice.due_date)}
              </div>
            </div>
            <Link
              href="/nnak/me/membership"
              className="text-xs text-slate-500 hover:text-primary whitespace-nowrap"
            >
              View details
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              value={stkPhone}
              onChange={(e) => setStkPhone(e.target.value)}
              placeholder={profile?.phone || "254700000000"}
              className="px-3 py-2 border border-amber-300 rounded-md text-sm bg-white w-full sm:w-48"
            />
            <button
              onClick={() => {
                const phone = stkPhone || profile?.phone || "";
                if (!phone) return;
                stkPush.mutate(
                  { invoiceId: invoice.id, body: { phone_number: phone } },
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

const PortalCard = ({ href, icon: Icon, title, primary, subtitle, tone = "ok" }: PortalCardProps) => {
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
      <div className="text-xs uppercase tracking-wide text-slate-500 mt-3">{title}</div>
      <div className="text-base font-semibold text-slate-900 mt-1 truncate">{primary}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</div>
    </Link>
  );
};
