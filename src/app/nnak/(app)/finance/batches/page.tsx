"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import {
  useAdminBranchBatches,
  useRecordBatchPayment,
} from "@/hooks/use-branch-batches";
import { useNnakBranches } from "@/hooks/use-branches";
import { usePaymentMethods } from "@/hooks/use-enums";
import { MdAttachMoney, MdClose, MdReceipt } from "react-icons/md";
import type { BranchBatch } from "@/types/nnak";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};

const today = () => new Date().toISOString().slice(0, 10);

export default function FinanceBranchBatchesPage() {
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const { data: branches = [] } = useNnakBranches();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: batches = [], isLoading } = useAdminBranchBatches({
    period: period || undefined,
    status: status || undefined,
    branch_id: branchId || undefined,
  });
  const record = useRecordBatchPayment();

  const [openFor, setOpenFor] = useState<BranchBatch | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [files, setFiles] = useState<File[]>([]);

  const closeModal = () => {
    setOpenFor(null);
    setAmount("");
    setReference("");
    setMethod("bank_transfer");
    setNotes("");
    setPaidAt(today());
    setFiles([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openFor) return;
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
        batchId: openFor.id,
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

  const paidAmount = (b: BranchBatch) =>
    Math.max(0, Number(b.branch_share) - Number(b.outstanding));

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Branch Batches"
        description="Reconcile branch monthly remittances"
      />

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Branch
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Period
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-sm text-center text-slate-500">
            <MdReceipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No batches match the filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2 text-right">Collected</th>
                <th className="px-3 py-2 text-right">Branch Share</th>
                <th className="px-3 py-2 text-right">Paid</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b: BranchBatch) => {
                const outstanding = Number(b.outstanding);
                const paid = paidAmount(b);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">
                      {b.branch?.name || "—"}
                    </td>
                    <td className="px-3 py-2">{b.period}</td>
                    <td className="px-3 py-2 text-right">
                      KES {Number(b.total_collected).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KES {Number(b.branch_share).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700">
                      KES {paid.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      KES {outstanding.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold whitespace-nowrap ${
                          STATUS_TONE[b.status] || STATUS_TONE.pending
                        }`}
                      >
                        {String(b.status).replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/nnak/finance/batches/${b.id}`}
                          className="text-xs text-slate-500 font-medium hover:underline"
                        >
                          Details
                        </Link>
                        <button
                          disabled={outstanding <= 0}
                          onClick={() => {
                            setOpenFor(b);
                            setAmount(String(outstanding));
                          }}
                          className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                        >
                          <MdAttachMoney className="w-4 h-4" /> Record
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openFor && (
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
                <h3 className="text-base font-semibold text-slate-900">
                  Record Batch Payment
                </h3>
                <div className="text-xs text-slate-500">
                  {openFor.branch?.name} · {openFor.period}
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs grid grid-cols-3 gap-2">
              <div>
                <div className="text-slate-500">Branch Share</div>
                <div className="font-semibold">
                  KES {Number(openFor.branch_share).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Paid</div>
                <div className="font-semibold text-emerald-700">
                  KES {paidAmount(openFor).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Outstanding</div>
                <div className="font-semibold">
                  KES {Number(openFor.outstanding).toLocaleString()}
                </div>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. June remittance"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attachments
              </label>
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
