"use client";
import { useState } from "react";
import { MdUpload, MdClose } from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import {
  useFinanceByproducts,
  useFinanceUploadByproduct,
  useFinanceDownloadByproductTemplate,
} from "@/hooks/use-finance";

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function FinanceByproductsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(monthsAgoIso(1));
  const [endDate, setEndDate] = useState(todayIso());

  const { data, isLoading } = useFinanceByproducts({
    page,
    per_page: 15,
    status: statusFilter || undefined,
  });
  const uploads = data?.data ?? [];
  const pagination = data?.pagination;

  const uploadMutation = useFinanceUploadByproduct();
  const downloadTemplate = useFinanceDownloadByproductTemplate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await uploadMutation.mutateAsync({
      file,
      start_date: startDate,
      end_date: endDate,
    });
    setFile(null);
    setPage(1);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="By-Product Reconciliation"
        description="Upload and track branch monthly remittance files"
        action={
          <button
            onClick={() => downloadTemplate.mutate()}
            disabled={downloadTemplate.isPending}
            className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
          >
            {downloadTemplate.isPending ? "Downloading…" : "Download Template"}
          </button>
        }
      />

      {/* Upload form */}
      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-lg p-5"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Upload Remittance File
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploadMutation.isPending || !file}
              className="w-full bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload File"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-2">
            File (.csv, .xlsx, .xls)
          </label>
          {file ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <MdUpload className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {file.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-600 p-1"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <MdUpload className="w-7 h-7 text-slate-400 mb-1.5" />
              <span className="text-sm text-slate-500">
                Click to browse or drag and drop
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                CSV, XLSX, or XLS
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Uploads table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-900">
          Upload History
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Processed</th>
                  <th className="px-3 py-2 text-right">Skipped</th>
                  <th className="px-3 py-2 text-right">Failed</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-slate-500 text-sm"
                    >
                      No uploads yet.
                    </td>
                  </tr>
                ) : (
                  uploads.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td
                        className="px-3 py-2 text-xs font-medium max-w-[160px] truncate"
                        title={u.file_name}
                      >
                        {u.file_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {fmtDate(u.start_date)} → {fmtDate(u.end_date)}
                      </td>
                      <td className="px-3 py-2 text-right">{u.total_rows ?? 0}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">
                        {u.processed_rows ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-600">
                        {u.skipped_count ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600">
                        {u.failed_rows ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                            u.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : u.status === "processing"
                                ? "bg-amber-50 text-amber-700"
                                : u.status === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {fmtDate(u.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
