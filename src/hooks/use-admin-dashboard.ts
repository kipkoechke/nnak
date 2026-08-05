"use client";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardService, type DateRangeParams } from "@/services/admin-dashboard.service";
import { nqk } from "@/lib/query-keys";

export const useAdminDashboard = (
  params?: DateRangeParams,
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.adminDashboard(params as Record<string, unknown>),
    queryFn: () => adminDashboardService.load(params),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled ?? true,
  });

/** Executive members read the identical payload off /executive/dashboard. */
export const useExecutiveDashboard = (
  params?: DateRangeParams,
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.executiveDashboard(params as Record<string, unknown>),
    queryFn: () => adminDashboardService.loadExecutive(params),
    placeholderData: (prev) => prev,
    enabled: opts?.enabled ?? true,
  });
