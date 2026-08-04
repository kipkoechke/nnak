"use client";
import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useByProductUploadStatus } from "@/hooks/use-byproduct";
import { parseByProductErrors, byProductStatusClass } from "@/lib/byproduct";

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString() : "—";
const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString() : "—";

export default function ByProductUploadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: upload, isLoading } = useByProductUploadStatus(id);

  const errorLines = useMemo(
    () => parseByProductErrors(upload?.errors),
    [upload?.errors],
  );

  if (isLoading && !upload)
    return <div className="p-4 text-sm text-slate-500">Loading upload…</div>;
  if (!upload)
    return <div className="p-4 text-sm text-slate-500">Upload not found.</div>;

  const processed = upload.processed_rows ?? 0;
  const total = upload.total_rows ?? 0;
  const pctProcessed = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title={upload.file_name || "By-Product Upload"}
        description={`Uploaded ${fmtDateTime(upload.created_at)}`}
        back={() => router.back()}
      />

      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${byProductStatusClass(upload.status)}`}
          >
            {upload.status}
          </span>
          <span className="text-xs text-slate-500">
            Period {fmtDate(upload.start_date)} — {fmtDate(upload.end_date)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Total rows" value={total} />
          <Stat label="Renewed" value={processed} accent="emerald" />
          <Stat
            label="Skipped"
            value={upload.skipped_count ?? 0}
            accent="amber"
          />
          {/* The detail endpoint reports unmatched rows as `not_found`; the
              list only has `failed_rows`. Show whichever is present. */}
          {upload.not_found != null ? (
            <Stat label="Not found" value={upload.not_found} accent="red" />
          ) : (
            <Stat label="Failed" value={upload.failed_rows ?? 0} accent="red" />
          )}
        </div>

        {total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Renewed</span>
              <span>{pctProcessed}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${pctProcessed}%` }}
              />
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <Item label="Last updated" value={fmtDateTime(upload.updated_at)} />
          <Item label="Notified at" value={fmtDateTime(upload.notified_at)} />
        </dl>
      </div>

      {/* Skipped / error rows */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 text-sm font-semibold border-b border-slate-200 flex items-center justify-between">
          <span>Skipped / Errors</span>
          <span className="text-xs font-normal text-slate-500">
            {errorLines.length} row{errorLines.length === 1 ? "" : "s"}
          </span>
        </div>
        {errorLines.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            No skipped or failed rows — every row processed cleanly.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-125 overflow-auto">
            {errorLines.map((line, i) => (
              <li
                key={i}
                className="px-3 py-2 text-xs text-slate-700 flex gap-2"
              >
                <span className="text-slate-400 shrink-0 tabular-nums">
                  {i + 1}.
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const Stat = ({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "emerald" | "amber" | "red";
}) => {
  const cls = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-600",
    red: "text-red-600",
  }[accent];
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${cls}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
};

const Item = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd
      className={`text-sm text-slate-800 mt-0.5 break-all ${mono ? "font-mono text-xs" : ""}`}
    >
      {value || "—"}
    </dd>
  </div>
);
