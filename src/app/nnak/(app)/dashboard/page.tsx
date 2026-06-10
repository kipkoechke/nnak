"use client";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useNnakMe } from "@/hooks/use-auth";
import { isMemberRole } from "@/lib/rbac";
import MemberDashboard from "./MemberDashboard";
import AdminDashboard from "./AdminDashboard";
import BranchDashboard from "./BranchDashboard";

export default function NnakDashboardPage() {
  const { data: user } = useNnakMe();

  const view = useMemo<"member" | "branch" | "admin" | null>(() => {
    if (!user) return null;
    if (isMemberRole(user)) return "member";
    if (user.role === "branch" || user.role === "branch_manager") return "branch";
    return "admin";
  }, [user]);

  if (!user) {
    return <div className="px-4 py-6 text-sm text-slate-500">Loading dashboard…</div>;
  }

  if (view === "member") {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        <PageHeader title="Member Portal" description="Your membership at a glance" />
        <MemberDashboard />
      </div>
    );
  }

  if (view === "branch") {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        <PageHeader title="Branch Dashboard" description={`Welcome, ${user.name}`} />
        <BranchDashboard />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="Dashboard" description={`Welcome, ${user.name}`} />
      <AdminDashboard />
    </div>
  );
}
