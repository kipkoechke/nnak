"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import AdminDashboard from "../../dashboard/AdminDashboard";

/**
 * Association-wide summary for executive members — the admin dashboard's
 * numbers with none of its routes. Admins can open it too; the backend allows
 * both, and it saves keeping a second copy of the screen in sync.
 */
export default function ExecutiveDashboardPage() {
  const { data: user, isLoading } = useNnakMe();
  const router = useRouter();
  const allowed = nnakCan.viewExecutiveDashboard(user);

  // The middleware guards this route from the cookie; this is the client-side
  // echo for a session whose cookie predates the executive flag.
  useEffect(() => {
    if (!isLoading && user && !allowed) router.replace("/nnak/dashboard");
  }, [isLoading, user, allowed, router]);

  if (!user || !allowed) {
    return (
      <div className="px-4 py-6 text-sm text-slate-500">Loading dashboard…</div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader
        title="Executive Dashboard"
        description="Association-wide summary. Figures are read-only."
      />
      <AdminDashboard scope="executive" />
    </div>
  );
}
