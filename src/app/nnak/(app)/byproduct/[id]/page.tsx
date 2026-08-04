"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import UploadDetail from "@/components/byproduct/UploadDetail";
import { useByProductUploadStatus } from "@/hooks/use-byproduct";

export default function ByProductUploadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: upload, isLoading } = useByProductUploadStatus(id);

  return (
    <UploadDetail
      upload={upload}
      isLoading={isLoading}
      onBack={() => router.back()}
    />
  );
}
