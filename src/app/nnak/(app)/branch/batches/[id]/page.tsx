"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useBranchBatch } from "@/hooks/use-branch-batches";

const fmt = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

export default function BranchBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: batch, isLoading } = useBranchBatch(id);

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading batch…</div>;
  }
  if (!batch) {
    return <div className="p-6 text-sm text-slate-500">Batch not found.</div>;
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={`Batch · ${batch.period}`}
        description={batch.branch?.name}
        back={() => router.back()}
        action={
          <span
            className={`text-[10px] px-2 py-1 rounded-full uppercase font-semibold ${
              STATUS_TONE[batch.status] || STATUS_TONE.draft
            }`}
          >
            {String(batch.status).replace(/_/g, " ")}
          </span>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Members" value={(batch.member_count ?? 0).toLocaleString()} />
        <Stat
          label="Total"
          value={`KES ${Number(batch.total_amount ?? 0).toLocaleString()}`}
        />
        <Stat
          label="Paid"
          value={`KES ${Number(batch.amount_paid ?? 0).toLocaleString()}`}
        />
        <Stat
          label="Balance"
          value={`KES ${Number(batch.balance ?? 0).toLocaleString()}`}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Due Date
          </div>
          <div>{fmt(batch.due_date)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Submitted
          </div>
          <div>{fmt(batch.submitted_at)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Paid On
          </div>
          <div>{fmt(batch.paid_at)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Created
          </div>
          <div>{fmt(batch.created_at)}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
          Members in this batch
        </div>
        {!batch.lines?.length ? (
          <div className="p-6 text-sm text-center text-slate-500">
            No line items.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Membership #</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2 font-medium">
                    {l.member_name || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {l.membership_number || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    KES {Number(l.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs">{l.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!!batch.payments?.length && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
            Payments recorded
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-xs">{fmt(p.paid_at)}</td>
                  <td className="px-3 py-2 text-xs capitalize">
                    {p.payment_method?.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.payment_reference || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    KES {Number(p.amount_paid).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {p.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
