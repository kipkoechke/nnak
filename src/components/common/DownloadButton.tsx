"use client";
import { useState } from "react";
import { MdFileDownload } from "react-icons/md";
import toast from "react-hot-toast";
import { exportToExcel, type ExcelColumn } from "@/lib/export-excel";

type DownloadButtonProps<T> = {
  /** Base file name — a date and .xlsx extension are appended automatically. */
  filename: string;
  columns: ExcelColumn<T>[];
  sheetName?: string;
  label?: string;
  className?: string;
} & (
  | {
      /** Rows already in hand — usually the current page. */
      rows: T[];
      fetchRows?: never;
    }
  | {
      /**
       * Fetched on click, so the export can span every matching record rather
       * than only the page on screen. Used for paginated listings.
       */
      fetchRows: () => Promise<T[]>;
      rows?: never;
    }
);

/**
 * Exports table data to an .xlsx file. Either hand it `rows` directly, or a
 * `fetchRows` thunk it calls on click to pull the full result set first.
 */
export default function DownloadButton<T>({
  filename,
  columns,
  sheetName,
  label = "Download",
  className = "",
  rows,
  fetchRows,
}: DownloadButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const data = fetchRows ? await fetchRows() : (rows ?? []);
      if (data.length === 0) {
        toast.error("Nothing to download");
        return;
      }
      await exportToExcel({ filename, columns, rows: data, sheetName });
    } catch {
      toast.error("Could not prepare the download");
    } finally {
      setLoading(false);
    }
  };

  // With static rows we can disable up front; with a fetch we only know after.
  const disabled = loading || (!fetchRows && (rows?.length ?? 0) === 0);

  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled}
      title={disabled && !loading ? "Nothing to download" : "Download as Excel"}
      className={`inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <MdFileDownload className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Preparing…" : label}
    </button>
  );
}
