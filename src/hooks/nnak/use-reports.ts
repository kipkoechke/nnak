"use client";
import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/nnak/reports.service";
import { nqk } from "@/lib/nnak/query-keys";

export const useKpis = () =>
  useQuery({ queryKey: nqk.reports.kpis, queryFn: reportsService.kpis, staleTime: 30_000 });
