"use client";
import { filterOptions } from "@/lib/available-filters";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import UploadsTable from "@/components/byproduct/UploadsTable";
import { useByProductApiList } from "@/hooks/use-byproduct";
import { MdUpload } from "react-icons/md";

/** Used until the route advertises its own in meta.available_filters. */
const STATUS_FALLBACK = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default function ByProductPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data: uploadsData, isLoading } = useByProductApiList({
    page,
    per_page: 15,
    status: status || undefined,
  });
  const uploads = uploadsData?.data ?? [];
  const pagination = uploadsData?.pagination;
  const statusOptions = filterOptions(
    uploadsData?.listing?.available_filters?.status,
    STATUS_FALLBACK,
    "All statuses",
  );

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="By-Product Reconciliation"
        description="Branch monthly remittance uploads"
        action={
          <Link
            href="/nnak/byproduct/upload"
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdUpload className="w-4 h-4" /> New Upload
          </Link>
        }
      />


      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <UploadsTable
        basePath="/nnak/byproduct"
        uploads={uploads}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </div>
  );
}
