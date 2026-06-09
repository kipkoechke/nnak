"use client";
import { useQuery } from "@tanstack/react-query";
import { enumsService } from "@/services/enums.service";
import { nqk } from "@/lib/query-keys";

// Cached for the lifetime of the session — these endpoints are
// effectively static configuration data.
const STATIC_OPTS = {
  staleTime: 1000 * 60 * 60, // 1h
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;

export const useGenders = () =>
  useQuery({
    queryKey: nqk.enums.genders,
    queryFn: enumsService.genders,
    ...STATIC_OPTS,
  });

export const useEmployerTypes = () =>
  useQuery({
    queryKey: nqk.enums.employerTypes,
    queryFn: enumsService.employerTypes,
    ...STATIC_OPTS,
  });

export const useBillingFrequencies = () =>
  useQuery({
    queryKey: nqk.enums.billingFrequencies,
    queryFn: enumsService.billingFrequencies,
    ...STATIC_OPTS,
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: nqk.enums.paymentMethods,
    queryFn: enumsService.paymentMethods,
    ...STATIC_OPTS,
  });

export const useUserRoles = () =>
  useQuery({
    queryKey: nqk.enums.userRoles,
    queryFn: enumsService.userRoles,
    ...STATIC_OPTS,
  });

export const useChapters = () =>
  useQuery({
    queryKey: nqk.enums.chapters,
    queryFn: enumsService.chapters,
    ...STATIC_OPTS,
  });
