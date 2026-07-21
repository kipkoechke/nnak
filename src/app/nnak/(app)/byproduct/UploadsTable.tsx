"use client";
import Link from "next/link";
import Pagination from "@/components/common/Pagination";
import { byProductStatusClass } from "@/lib/byproduct";
import type { ByProductUploadRecord, NnakPagination } from "@/types/nnak";

interface UploadsTableProps {
  uploads: ByProductUploadRecord[];
  pagination?: NnakPagination;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

/** Recent by-product uploads. Each row links to its own detail page. */
export default function UploadsTable({
  uploads,
  pagination,
  isLoading,
  onPageChange,
}: UploadsTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 text-sm font-semibold border-b border-slate-200">
        Recent uploads
      </div>
      <div className="overflow-x-auto">
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
            {isLoading && uploads.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-slate-500 text-sm"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && uploads.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-slate-500 text-sm"
                >
                  No uploads yet
                </td>
              </tr>
            )}
            {uploads.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td
                  className="px-3 py-2 text-xs font-medium max-w-50 truncate"
                  title={u.file_name}
                >
                  <Link
                    href={`/nnak/byproduct/${u.id}`}
                    className="text-primary hover:underline"
                  >
                    {u.file_name || "—"}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {new Date(u.start_date).toLocaleDateString()} —{" "}
                  {new Date(u.end_date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">{u.total_rows || 0}</td>
                <td className="px-3 py-2 text-emerald-700">
                  {u.processed_rows || 0}
                </td>
                <td className="px-3 py-2 text-amber-600">
                  {u.skipped_count || 0}
                </td>
                <td className="px-3 py-2 text-red-600">{u.failed_rows || 0}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${byProductStatusClass(u.status)}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    href={`/nnak/byproduct/${u.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
