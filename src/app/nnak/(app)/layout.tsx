"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import NnakAppLayout from "@/components/layout/NnakAppLayout";
import { useNnakMe } from "@/hooks/nnak/use-auth";

export default function RootNnakAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useNnakMe();
  useEffect(() => {
    if (!isLoading && !user) router.replace("/nnak/login");
  }, [isLoading, user, router]);
  return <NnakAppLayout>{children}</NnakAppLayout>;
}
