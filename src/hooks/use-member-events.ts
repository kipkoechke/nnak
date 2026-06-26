"use client";
import { useQuery } from "@tanstack/react-query";
import { memberEventsService } from "@/services/member-events.service";
import { nqk } from "@/lib/query-keys";

export const useMemberEvents = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.memberEvents.list(params ?? {}),
    queryFn: () =>
      memberEventsService.list(
        params as Parameters<typeof memberEventsService.list>[0],
      ),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useMemberEvent = (id: string) =>
  useQuery({
    queryKey: nqk.memberEvents.detail(id),
    queryFn: () => memberEventsService.detail(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

export const useMemberEventPackages = (id: string) =>
  useQuery({
    queryKey: nqk.memberEvents.packages(id),
    queryFn: () => memberEventsService.packages(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
