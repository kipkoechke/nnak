"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventsService } from "@/services/events.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateEventInput, NnakEvent } from "@/types/nnak";

export const useEvents = (p?: Record<string, unknown>) =>
  useQuery({
    queryKey: nqk.events.list(p ?? {}),
    queryFn: () => eventsService.list(p as { page?: number; per_page?: number; status?: string }),
    placeholderData: (prev) => prev,
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: nqk.events.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
  });

export const useEventRegistrants = (id: string) =>
  useQuery({
    queryKey: nqk.events.registrants(id),
    queryFn: () => eventsService.registrants(id),
    enabled: !!id,
  });

export const useMyRegistrations = (userId?: string) =>
  useQuery({
    queryKey: [...nqk.events.all, "mine", userId ?? ""] as const,
    queryFn: () => eventsService.myRegistrations(userId!),
    enabled: !!userId,
  });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => eventsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      toast.success("Event created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create event failed")),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateEventInput> }) =>
      eventsService.update(id, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      qc.invalidateQueries({ queryKey: nqk.events.detail(v.id) });
      toast.success("Event updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update event failed")),
  });
};

export const useUpsertEvent = () => {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  return {
    mutateAsync: async (data: Partial<NnakEvent & CreateEventInput>): Promise<NnakEvent | null> => {
      if ("id" in data && data.id) {
        return updateMutation.mutateAsync({ id: data.id, input: data as Partial<CreateEventInput> });
      }
      return createMutation.mutateAsync(data as CreateEventInput);
    },
    isPending: createMutation.isPending || updateMutation.isPending,
  };
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      toast.success("Event deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete event failed")),
  });
};

export const useRegisterForEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId, fee }: { eventId: string; userId: string; fee: number }) =>
      eventsService.register(eventId, userId, fee),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.events.detail(v.eventId) });
      qc.invalidateQueries({ queryKey: nqk.events.registrants(v.eventId) });
      toast.success("Registered");
    },
    onError: (e) => toast.error(extractApiError(e, "Registration failed")),
  });
};

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qrToken: string) => eventsService.checkIn(qrToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      toast.success("Checked in");
    },
    onError: (e) => toast.error(extractApiError(e, "Check-in failed")),
  });
};

export const useIssueCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (regId: string) => eventsService.issueCertificate(regId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      toast.success("Certificate issued");
    },
    onError: (e) => toast.error(extractApiError(e, "Certificate failed")),
  });
};
