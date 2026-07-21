"use client";
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { ModalShell } from "@/components/common/Modal";
import {
  useByProductApiList,
  useByProductUploadStatus,
  useUploadByProductFile,
  useDownloadByProductTemplate,
} from "@/hooks/use-byproduct";
import { MdUpload, MdClose } from "react-icons/md";

/**
 * The API returns `errors` as a JSON-encoded array of strings (occasionally a
 * bare string). Decode it into lines so the UI can list them instead of
 * dumping escaped JSON.
 */
const parseErrors = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((e) => String(e));
    return [String(parsed)];
  } catch {
    return [raw];
  }
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthsAgoIso = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export default function ByProductPage() {
  const [page, setPage] = useState(1);
  const { data: uploadsData } = useByProductApiList({ page, per_page: 15 });
  const uploads = uploadsData?.data ?? [];
  const pagination = uploadsData?.pagination;
  const uploadMutation = useUploadByProductFile();
  const downloadTemplate = useDownloadByProductTemplate();

  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState(monthsAgoIso(1));
  const [endDate, setEndDate] = useState(todayIso());
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } =
    useByProductUploadStatus(detailId ?? undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await uploadMutation.mutateAsync({ file, start_date: startDate, end_date: endDate });
    setFile(null);
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="By-Product Reconciliation"
        description="Upload branch monthly remittance"
        action={
          <button
            onClick={() => downloadTemplate.mutate()}
            disabled={downloadTemplate.isPending}
            className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50"
          >
            {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
          </button>
        }
      />

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
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
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 mb-2">
            Upload Remittance File (.csv, .xlsx, .xls)
          </label>
          {file ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <MdUpload className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{file.name}</div>
                  <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
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
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <MdUpload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Click to browse or drag and drop</span>
              <span className="text-xs text-slate-400 mt-1">CSV, XLSX, or XLS files</span>
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

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 text-sm font-semibold border-b">Recent uploads</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">File</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Processed</th>
              <th className="px-3 py-2">Skipped</th>
              <th className="px-3 py-2">Failed</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uploads.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500 text-sm">No uploads yet</td></tr>
            )}
            {uploads.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 text-xs font-medium max-w-50 truncate" title={u.file_name}>{u.file_name || "—"}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">{new Date(u.start_date).toLocaleDateString()} — {new Date(u.end_date).toLocaleDateString()}</td>
                <td className="px-3 py-2">{u.total_rows || 0}</td>
                <td className="px-3 py-2 text-emerald-700">{u.processed_rows || 0}</td>
                <td className="px-3 py-2 text-amber-600">{u.skipped_count || 0}</td>
                <td className="px-3 py-2 text-red-600">{u.failed_rows || 0}</td>
                <td className="px-3 py-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    u.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                    u.status === "processing" ? "bg-amber-50 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{u.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => setDetailId(u.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    More
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination && pagination.last_page > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

      <ModalShell isOpen={!!detailId} onClose={() => setDetailId(null)}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Upload details
            </h3>
            <button
              onClick={() => setDetailId(null)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
          {detailLoading && !detail ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : !detail ? (
            <p className="text-sm text-slate-500">No details available.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="font-medium text-slate-900 break-all">
                {detail.file_name || "—"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Status" value={detail.status} />
                <Detail
                  label="Period"
                  value={`${new Date(detail.start_date).toLocaleDateString()} — ${new Date(detail.end_date).toLocaleDateString()}`}
                />
                <Detail label="Total rows" value={String(detail.total_rows ?? 0)} />
                <Detail
                  label="Processed"
                  value={String(detail.processed_rows ?? 0)}
                />
                <Detail label="Failed" value={String(detail.failed_rows ?? 0)} />
                <Detail
                  label="Skipped"
                  value={String(detail.skipped_count ?? 0)}
                />
                <Detail
                  label="Uploaded"
                  value={new Date(detail.created_at).toLocaleString()}
                />
              </div>
              {(() => {
                const lines = parseErrors(detail.errors);
                if (lines.length === 0) return null;
                return (
                  <div>
                    <div className="text-[11px] uppercase text-slate-500 mb-1">
                      Skipped / Errors ({lines.length})
                    </div>
                    <ul className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-md divide-y divide-amber-200/70 max-h-56 overflow-auto">
                      {lines.map((line, i) => (
                        <li key={i} className="px-2 py-1.5">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[11px] uppercase text-slate-500">{label}</div>
    <div className="text-slate-800 capitalize">{value || "—"}</div>
  </div>
);
