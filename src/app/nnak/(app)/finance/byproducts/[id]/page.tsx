"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import UploadDetail from "@/components/byproduct/UploadDetail";
import { useFinanceByproductDetail } from "@/hooks/use-finance";

export default function FinanceByproductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: upload, isLoading } = useFinanceByproductDetail(id);

  return (
    <UploadDetail
      upload={upload}
      isLoading={isLoading}
      onBack={() => router.back()}
    />
  );
}
