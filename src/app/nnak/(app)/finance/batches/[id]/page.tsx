"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import {
  useFinanceBatch,
  useRecordFinanceBatchPayment,
  useRetryFinanceBatch,
} from "@/hooks/use-finance";
import {
  useAdminBranchBatch,
  useRecordBatchPayment,
  useRetryBranchBatch,
} from "@/hooks/use-branch-batches";
import { useNnakMe } from "@/hooks/use-auth";
import { usePaymentMethods } from "@/hooks/use-enums";
import { MdAttachMoney, MdClose, MdRefresh, MdSearch } from "react-icons/md";
import DownloadButton from "@/components/common/DownloadButton";
import { ModalShell } from "@/components/common/Modal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { financeService } from "@/services/finance.service";
import { branchBatchesService } from "@/services/branch-batches.service";
import { fmtCommissionValue, fmtKes } from "@/lib/commission";
import type { ExcelColumn } from "@/lib/export-excel";
import { useState } from "react";
import toast from "react-hot-toast";

const fmt = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4">
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-lg font-semibold text-slate-900 mt-1">{value}</div>
  </div>
);

const today = () => new Date().toISOString().slice(0, 10);

/** Members inside a batch are paged server-side; the detail `meta` carries no
 *  page count, so paging is driven by whether a full page came back. */
const MEMBERS_PER_PAGE = 15;

export default function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  // Finance staff read /finance/batches/{id}; admins /admin/branch-batches/{id}.
  const { data: me } = useNnakMe();
  const isFinance = me?.role === "finance";

  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const memberParams = {
    search: memberSearch || undefined,
    page: memberPage,
    per_page: MEMBERS_PER_PAGE,
  };

  const financeQ = useFinanceBatch(
    id,
    { enabled: !!me && isFinance },
    memberParams,
  );
  const adminQ = useAdminBranchBatch(
    !!me && !isFinance ? id : undefined,
    memberParams,
  );
  const batch = isFinance ? financeQ.data : adminQ.data;
  const isLoading = isFinance ? financeQ.isLoading : adminQ.isLoading;

  const { data: paymentMethods = [] } = usePaymentMethods();
  const financeRecord = useRecordFinanceBatchPayment();
  const adminRecord = useRecordBatchPayment();
  const record = isFinance ? financeRecord : adminRecord;

  const financeRetry = useRetryFinanceBatch();
  const adminRetry = useRetryBranchBatch();
  const retry = isFinance ? financeRetry : adminRetry;
  const [showRetry, setShowRetry] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [files, setFiles] = useState<File[]>([]);

  const closeModal = () => {
    setShowModal(false);
    setAmount("");
    setReference("");
    setMethod("bank_transfer");
    setNotes("");
    setPaidAt(today());
    setFiles([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (!reference.trim()) {
      toast.error("Payment reference is required");
      return;
    }
    const r = await record
      .mutateAsync({
        batchId: batch.id,
        body: {
          amount_paid: Number(amount),
          payment_reference: reference.trim(),
          payment_method: method,
          notes: notes.trim() || undefined,
          paid_at: paidAt,
          attachments: files,
        },
      })
      .catch(() => null);
    if (r) closeModal();
  };

  if (isLoading)
    return <div className="p-4 text-sm text-slate-500">Loading batch…</div>;
  if (!batch)
    return <div className="p-4 text-sm text-slate-500">Batch not found.</div>;

  // Money arrives as decimal strings; Number("") and Number(undefined) would
  // both surface as NaN in the UI.
  const num = (v: unknown) => {
    const n = Number(v ?? 0);
    return Number.isNaN(n) ? 0 : n;
  };
  const outstanding = num(batch.pending_remittance);
  const paid = num(batch.total_remitted);

  // Finance and admin batch detail return slightly different member shapes;
  // this is the subset both share and the export reads.
  type BatchMemberRow = {
    id: string;
    user?: { name?: string | null; email?: string | null } | null;
    /** The list sends `amount_paid`, the detail `amount`. */
    amount_paid?: string | number;
    amount?: string | number;
    commission_amount: string | number;
    commission_type?: string | null;
    commission_value?: string | number | null;
  };
  const memberAmount = (m: BatchMemberRow) => m.amount_paid ?? m.amount ?? 0;
  const members = (batch.members ?? []) as BatchMemberRow[];

  /** The table shows one server page; the export pulls the whole batch. */
  const fetchExportMembers = async (): Promise<BatchMemberRow[]> => {
    const full = isFinance
      ? await financeService.batchDetail(id, { per_page: 1000 })
      : await branchBatchesService.adminDetail(id, { per_page: 1000 });
    return (full?.members ?? []) as BatchMemberRow[];
  };

  const memberColumns: ExcelColumn<BatchMemberRow>[] = [
    { header: "Member", value: (m) => m.user?.name ?? "" },
    { header: "Email", value: (m) => m.user?.email ?? "" },
    { header: "Amount Paid", value: (m) => Number(memberAmount(m)) },
    { header: "Commission", value: (m) => Number(m.commission_amount ?? 0) },
    {
      header: "Commission Type",
      value: (m) => m.commission_type?.replace(/_/g, " ") ?? "",
    },
    {
      header: "Commission Value",
      value: (m) => (m.commission_value == null ? "" : m.commission_value),
    },
  ];

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title={`Batch · ${batch.period}`}
        description={batch.branch?.name}
        back={() => router.back()}
        action={
          <div className="flex items-center gap-2">
            <DownloadButton
              filename={`batch-${batch.reference_code}-members`}
              sheetName="Members"
              columns={memberColumns}
              fetchRows={fetchExportMembers}
            />
            <span
              className={`text-[10px] px-2 py-1 rounded-full uppercase font-semibold ${
                STATUS_TONE[batch.status] || STATUS_TONE.pending
              }`}
            >
              {String(batch.status).replace(/_/g, " ")}
            </span>
            {/* The API refuses to retry a paid batch. */}
            {batch.status !== "paid" && (
              <button
                onClick={() => setShowRetry(true)}
                title="Delete this batch and regenerate it"
                className="inline-flex items-center gap-1 text-xs border border-amber-300 text-amber-700 font-semibold px-3 py-1.5 rounded-md hover:bg-amber-50"
              >
                <MdRefresh className="w-4 h-4" /> Retry
              </button>
            )}
            {outstanding > 0 && (
              <button
                onClick={() => {
                  setAmount(String(outstanding));
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs bg-primary text-white font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90"
              >
                <MdAttachMoney className="w-4 h-4" /> Record Payment
              </button>
            )}
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Members" value={(batch.members_count ?? batch.members?.length ?? 0).toLocaleString()} />
        <Stat label="Collected" value={fmtKes(batch.total_collected)} />
        <Stat label="Branch Share" value={fmtKes(batch.branch_share)} />
        <Stat label="Outstanding" value={fmtKes(outstanding)} />
      </div>

      {/* Meta row */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Reference</div>
          <div className="font-mono text-xs">{batch.reference_code}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Commission</div>
          <div>{fmtKes(batch.commission)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Paid</div>
          <div className="text-emerald-700">{fmtKes(paid)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Paid On</div>
          <div>{fmt(batch.paid_at)}</div>
        </div>
      </div>

      {/* Branch info */}
      {batch.branch && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Branch</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] uppercase text-slate-500">Name</div>
              <div className="font-medium">{batch.branch.name}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-slate-500">Employer Type</div>
              <div>{batch.branch.employer_type_label || batch.branch.employer_type || "—"}</div>
            </div>
            {batch.branch.commission_type_label && (
              <div>
                <div className="text-[11px] uppercase text-slate-500">Commission Type</div>
                <div>
                  {batch.branch.commission_type_label} ·{" "}
                  {fmtCommissionValue(
                    batch.branch.commission_value,
                    batch.branch.commission_type,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members in batch */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Members in this batch
          </span>
          <div className="relative min-w-45 max-w-xs flex-1">
            <MdSearch className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
            <input
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setMemberPage(1);
              }}
              placeholder="Search member names…"
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        {!members.length ? (
          <div className="p-6 text-sm text-center text-slate-500">
            {memberSearch ? "No members match the search." : "No members."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 text-right">Amount Paid</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 font-medium">{m.user?.name || "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{m.user?.email || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {fmtKes(memberAmount(m))}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{fmtKes(m.commission_amount)}</td>
                  <td className="px-3 py-2 text-right text-xs text-slate-500 capitalize">
                    {m.commission_type?.replace(/_/g, " ")} ·{" "}
                    {fmtCommissionValue(m.commission_value, m.commission_type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(memberPage > 1 || members.length === MEMBERS_PER_PAGE) && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {memberPage}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                disabled={memberPage === 1}
                className="px-3 py-1 text-xs border border-slate-300 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setMemberPage((p) => p + 1)}
                disabled={members.length < MEMBERS_PER_PAGE}
                className="px-3 py-1 text-xs border border-slate-300 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payments recorded */}
      {!!batch.payments?.length && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
            Payments recorded
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Received By</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batch.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{fmt(p.paid_at)}</td>
                  <td className="px-3 py-2 text-slate-500">{p.received_by || "—"}</td>
                  <td className="px-3 py-2 text-xs capitalize">
                    {p.payment_method?.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.payment_reference || "—"}</td>
                  <td className="px-3 py-2 text-right">{fmtKes(p.amount_paid)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Retry confirmation — regeneration is queued, so the page is sent
          back to the list once it is dispatched. */}
      <ModalShell isOpen={showRetry} onClose={() => setShowRetry(false)} size="md">
        <DeleteConfirmationModal
          itemName={batch.reference_code}
          title="Retry batch"
          message={`This deletes batch ${batch.reference_code} (${batch.period}) along with its members and recorded payments, then queues it for regeneration.`}
          confirmLabel="Delete & Regenerate"
          pendingLabel="Queueing…"
          isDeleting={retry.isPending}
          onConfirm={async () => {
            const r = await retry
              .mutateAsync({ batchId: batch.id, period: batch.period })
              .catch(() => null);
            if (r) router.push("/nnak/finance/batches");
          }}
          onCloseModal={() => setShowRetry(false)}
        />
      </ModalShell>

      {/* Record payment modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Record Batch Payment</h3>
                <div className="text-xs text-slate-500">
                  {batch.branch?.name} · {batch.period}
                </div>
              </div>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs grid grid-cols-3 gap-2">
              <div>
                <div className="text-slate-500">Branch Share</div>
                <div className="font-semibold">{fmtKes(batch.branch_share)}</div>
              </div>
              <div>
                <div className="text-slate-500">Paid</div>
                <div className="font-semibold text-emerald-700">{fmtKes(paid)}</div>
              </div>
              <div>
                <div className="text-slate-500">Outstanding</div>
                <div className="font-semibold">{fmtKes(outstanding)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paid <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paid At <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary capitalize"
                >
                  {(paymentMethods.length
                    ? paymentMethods
                    : ["bank_transfer", "mpesa", "check_off", "card"]
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference <span className="text-red-500">*</span>
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. EFT-12345"
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attachments</label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold hover:file:bg-primary/20"
              />
              {files.length > 0 && (
                <div className="text-[11px] text-slate-500 mt-1">
                  {files.length} file{files.length === 1 ? "" : "s"} selected
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={record.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {record.isPending ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
