"use client";
import { useQuery } from "@tanstack/react-query";
import { adminDashboardService, type DateRangeParams } from "@/services/admin-dashboard.service";
import { nqk } from "@/lib/query-keys";

export const useAdminDashboard = (params?: DateRangeParams) =>
  useQuery({
    queryKey: nqk.adminDashboard(params as Record<string, unknown>),
    queryFn: () => adminDashboardService.load(params),
    placeholderData: (prev) => prev,
  });
