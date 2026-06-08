"use client";
import Link from "next/link";
import { MdBadge, MdEventAvailable, MdPayments, MdArrowForward, MdWorkOutline } from "react-icons/md";
import { useNnakMe } from "@/hooks/use-auth";
import { useMember } from "@/hooks/use-members";
import { useMyPayments } from "@/hooks/use-payments";
import { useMyRegistrations } from "@/hooks/use-events";
import { useCategories } from "@/hooks/use-categories";
import { useMemberDashboardApi } from "@/hooks/use-subscriptions";
import { useMyWorkstations } from "@/hooks/use-workstations";

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const daysUntil = (iso?: string | null) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
};

export default function MemberDashboard() {
  const { data: me } = useNnakMe();
  const { data: member } = useMember(me?.id ?? "");
  const { data: paymentsPage } = useMyPayments(me?.id);
  const { data: myRegs = [] } = useMyRegistrations(me?.id);
  const { data: cats = [] } = useCategories();
  const { data: apiDash } = useMemberDashboardApi();
  const { data: workstations = [] } = useMyWorkstations();

  if (!me || !member) return <div className="text-sm text-slate-500">Loading your portal…</div>;

  const cat = cats.find((c) => c.id === member.profile.member_category_id);
  // Real backend surfaces employer_type ("Parastatal", "MOH", ...) which
  // doubles as the member's category label. Fall back to the mock-store
  // category name only when employer_type isn't set (demo seed paths).
  const categoryLabel = member.profile.employer_type || cat?.name || "—";
  // Prefer the backend's authoritative expiry (from /member/dashboard) when
  // available; fall back to whatever the mock store carries for demo users.
  const apiExpiry = apiDash?.subscription?.end_date ?? null;
  const expiresIn = apiExpiry
    ? daysUntil(apiExpiry)
    : daysUntil(member.profile.subscription_expires_at);
  const nextEvent = [...myRegs]
    .filter((r) => r.event && new Date(r.event.starts_at) >= new Date())
    .sort((a, b) => (a.event?.starts_at || "").localeCompare(b.event?.starts_at || ""))[0];
  const lastPayment = paymentsPage?.data?.[0];
  // /member/dashboard surfaces subscription_status (pending_payment, active,
  // expired, cancelled). Map it to the existing MemberStatus tones; if the
  // backend hasn't responded yet we fall back to the cached member status.
  const apiStatus = apiDash?.subscription_status;
  const status =
    apiStatus === "active"
      ? "active"
      : apiStatus === "pending_payment"
        ? "pending"
        : apiStatus === "expired" || apiStatus === "cancelled"
          ? "inactive"
          : (member.profile.status || "pending");
  const currentWorkstation = workstations[0];

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
            Member #{member.profile.account_number} · {categoryLabel}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <PortalCard
          href="/nnak/me/membership"
          icon={MdBadge}
          title="My Membership"
          primary={fmtDate(apiExpiry ?? member.profile.subscription_expires_at)}
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
          href="/nnak/me/events"
          icon={MdEventAvailable}
          title="My Events"
          primary={nextEvent ? nextEvent.event!.name : "No upcoming"}
          subtitle={nextEvent ? `${fmtDate(nextEvent.event!.starts_at)} · ${nextEvent.event!.venue}` : "Browse events to register"}
        />
        <PortalCard
          href="/nnak/me/payments"
          icon={MdPayments}
          title="My Payments"
          primary={lastPayment ? `KES ${Number(lastPayment.amount).toLocaleString()}` : "—"}
          subtitle={lastPayment ? `${lastPayment.purpose} · ${fmtDate(lastPayment.paid_at)}` : "No payments yet"}
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

      {apiDash?.subscription?.invoice && !apiDash.subscription.invoice.status && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">
              Invoice {apiDash.subscription.invoice.invoice_number} —
              KES {Number(apiDash.subscription.invoice.amount).toLocaleString()}
            </div>
            <div className="text-xs opacity-80">
              Due {fmtDate(apiDash.subscription.invoice.due_date)}
            </div>
          </div>
          <Link
            href="/nnak/me/membership"
            className="bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-amber-800"
          >
            Pay now
          </Link>
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
