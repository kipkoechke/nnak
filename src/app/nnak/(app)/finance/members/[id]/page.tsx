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

const fmtMoney = (n?: number | null) =>
  n != null ? `KES ${Number(n).toLocaleString()}` : "—";

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900 mt-0.5">{value || "—"}</dd>
  </div>
);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

export default function FinanceMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useFinanceMember(id);

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading member…</div>;
  if (!data)
    return <div className="p-4 text-sm text-slate-500">Member not found.</div>;

  const { member, contributions, pending_invoices } = data;
  const sub = member.active_subscription;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={member.name}
        description={member.email}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
              member.is_approved
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {member.is_approved ? "Approved" : "Pending"}
          </span>
        }
      />

      {/* Contribution stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Lifetime Paid" value={fmtMoney(contributions.lifetime_paid)} />
        <Stat label="Lifetime Pending" value={fmtMoney(contributions.lifetime_pending)} />
        <Stat label="Pending Invoices" value={pending_invoices.length} />
      </div>

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Profile
        </h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Item label="Membership No." value={member.membership_number} />
          <Item label="Membership Type" value={member.membership_type} />
          <Item label="Chapter of Interest" value={member.chapter} />
          <Item label="Designation" value={member.designation?.toUpperCase()} />
          <Item label="NCK Number" value={member.nck_number} />
          <Item label="Phone" value={member.phone} />
          <Item label="Gender" value={member.gender} />
          <Item label="Qualification" value={member.professional_qualification} />
          <Item label="Cadre" value={member.professional_cadre} />
          <Item label="Branch" value={member.branch?.name} />
          <Item label="Joined" value={fmtDate(member.joined_at)} />
        </dl>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Active Subscription
        </h3>
        {sub ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Item label="Type" value={sub.membership_type} />
            <Item label="Amount" value={fmtMoney(sub.amount)} />
            <Item label="Start" value={fmtDate(sub.start_date)} />
            <Item label="End" value={fmtDate(sub.end_date)} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No active subscription.</p>
        )}
      </div>

      {/* Contribution history */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
          Contribution History
        </div>
        {!contributions.history.length ? (
          <div className="p-6 text-sm text-center text-slate-500">
            No contributions.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contributions.history.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono text-xs">{c.invoice_number}</td>
                  <td className="px-3 py-2">{c.membership_type || "—"}</td>
                  <td className="px-3 py-2 capitalize">
                    {c.payment_method?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.payment_reference || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(c.paid_at)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invoices */}
      {!!pending_invoices.length && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
            Pending Invoices
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending_invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-3 py-2">{inv.membership_type || "—"}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(inv.due_date)}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(inv.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
