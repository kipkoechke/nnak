"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import UploadsTable from "@/components/byproduct/UploadsTable";
import { useByProductApiList } from "@/hooks/use-byproduct";
import { MdUpload } from "react-icons/md";

export default function ByProductPage() {
  const [page, setPage] = useState(1);
  const { data: uploadsData, isLoading } = useByProductApiList({
    page,
    per_page: 15,
  });
  const uploads = uploadsData?.data ?? [];
  const pagination = uploadsData?.pagination;

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
