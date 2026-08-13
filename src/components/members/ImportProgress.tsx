"use client";
import { MdCheckCircle, MdErrorOutline, MdWarningAmber } from "react-icons/md";
import { useMemberImport } from "@/hooks/use-members";

const TONE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  processing: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

/**
 * Live status for one bulk import.
 *
 * The upload only queues the work, so this polls until the run reaches
 * `completed` or `failed` and then shows what actually happened — how many
 * rows were created, how many were skipped, and the reason for each skip.
 * Before this, a partially-successful import looked identical to a clean one.
 */
export default function ImportProgress({
  importId,
  onDone,
}: {
  importId: string;
  onDone: () => void;
}) {
  const { data: run, isLoading } = useMemberImport(importId);

  const status = String(run?.status ?? "pending").toLowerCase();
  const settled = status === "completed" || status === "failed";
  const errors = run?.errors ?? [];

  return (
    <div className="p-5 space-y-4 w-full max-w-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {settled ? "Import finished" : "Import in progress"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {run?.file_name || "Your file"}
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
            TONE[status] ?? TONE.pending
          }`}
        >
          {status}
        </span>
      </div>

      {!settled && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
          {isLoading
            ? "Checking status…"
            : "Members are being created in the background. This updates itself."}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Rows" value={run?.total_rows ?? 0} />
        <Stat label="Created" value={run?.created ?? 0} tone="text-emerald-700" />
        <Stat label="Skipped" value={run?.skipped ?? 0} tone="text-amber-600" />
      </div>

      {settled && errors.length === 0 && status === "completed" && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <MdCheckCircle className="w-4 h-4 shrink-0" />
          Every row was imported.
        </div>
      )}

      {status === "failed" && errors.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <MdErrorOutline className="w-4 h-4 shrink-0" />
          The import failed before any rows were processed.
        </div>
      )}

      {errors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <MdWarningAmber className="w-4 h-4 text-amber-500" />
            Skipped rows ({errors.length})
          </div>
          {/* Scrolls inside the card — a long list must not push the buttons
              off the bottom of the modal. */}
          <ul className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
            {errors.map((message, i) => (
              <li key={i} className="px-3 py-2 text-[11px] text-slate-600">
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={onDone}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
        >
          {settled ? "Done" : "Close and keep importing"}
        </button>
      </div>
    </div>
  );
}

const Stat = ({
  label,
  value,
  tone = "text-slate-900",
}: {
  label: string;
  value: number;
  tone?: string;
}) => (
  <div className="bg-slate-50 border border-slate-200 rounded-md py-2">
    <div className={`text-lg font-bold ${tone}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-slate-500">
      {label}
    </div>
  </div>
);
