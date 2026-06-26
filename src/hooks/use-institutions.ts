"use client";
import { useQuery } from "@tanstack/react-query";
import { institutionsService } from "@/services/institutions.service";
import { nqk } from "@/lib/query-keys";

export const useInstitutions = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  type?: string;
}) =>
  useQuery({
    queryKey: nqk.institutions.list(params),
    queryFn: () => institutionsService.list(params),
    staleTime: 300_000,
  });
