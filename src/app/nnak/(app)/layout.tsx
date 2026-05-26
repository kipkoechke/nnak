"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useNnakMe } from "@/hooks/nnak/use-auth";

export default function NnakAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useNnakMe();
  useEffect(() => {
    if (!isLoading && !user) router.replace("/nnak/login");
  }, [isLoading, user, router]);
  return <AppLayout>{children}</AppLayout>;
}
