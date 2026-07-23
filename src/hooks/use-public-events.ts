"use client";
import { useQuery } from "@tanstack/react-query";
import { publicEventsService } from "@/services/public-events.service";
import { nqk } from "@/lib/query-keys";

/** Public event listing — the same endpoint for members, students and guests. */
export const usePublicEvents = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) =>
  useQuery({
    queryKey: nqk.publicEvents.list(params as Record<string, unknown>),
    queryFn: () => publicEventsService.list(params),
    placeholderData: (prev) => prev,
  });

export const usePublicEvent = (id: string, opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: nqk.publicEvents.detail(id),
    queryFn: () => publicEventsService.detail(id),
    enabled: (opts?.enabled ?? true) && !!id,
  });

/** Packages are inlined on the detail response; use this when that is all you need. */
export const usePublicEventPackages = (
  id: string,
  opts?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: nqk.publicEvents.packages(id),
    queryFn: () => publicEventsService.packages(id),
    enabled: (opts?.enabled ?? true) && !!id,
  });
