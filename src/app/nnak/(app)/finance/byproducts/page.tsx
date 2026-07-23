"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import UploadsTable from "@/components/byproduct/UploadsTable";
import { useFinanceByproducts } from "@/hooks/use-finance";
import { MdUpload } from "react-icons/md";

export default function FinanceByproductsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFinanceByproducts({ page, per_page: 15 });
  const uploads = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="By-Product Reconciliation"
        description="Branch monthly remittance uploads"
        action={
          <Link
            href="/nnak/finance/byproducts/upload"
            className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm"
          >
            <MdUpload className="w-4 h-4" /> New Upload
          </Link>
        }
      />

      <UploadsTable
        basePath="/nnak/finance/byproducts"
        uploads={uploads}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </div>
  );
}
