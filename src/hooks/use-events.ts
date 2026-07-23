"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventsService } from "@/services/events.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateEventInput, NnakEvent, UpdateEventInput } from "@/types/nnak";

export const useEvents = (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) =>
  useQuery({
    queryKey: nqk.events.list(params as Record<string, unknown>),
    queryFn: () => eventsService.list(params),
    placeholderData: (prev) => prev,
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: nqk.events.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
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
    mutationFn: ({ id, input }: { id: string; input: UpdateEventInput }) =>
      eventsService.update(id, input),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      qc.invalidateQueries({ queryKey: nqk.events.detail(v.id) });
      toast.success("Event updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update event failed")),
  });
};

/** One entry point for the create/edit form — routes on the presence of an id. */
export const useUpsertEvent = () => {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  return {
    mutateAsync: async (
      data: Partial<NnakEvent> & Partial<CreateEventInput>,
    ): Promise<NnakEvent> => {
      if (data.id) {
        const { id, ...input } = data;
        return updateMutation.mutateAsync({
          id,
          input: input as UpdateEventInput,
        });
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

/** Approval is just an update; surfaced separately because the UI is a toggle. */
export const useSetEventApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_approved }: { id: string; is_approved: boolean }) =>
      eventsService.update(id, { is_approved }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      qc.invalidateQueries({ queryKey: nqk.events.detail(v.id) });
      toast.success(v.is_approved ? "Event approved" : "Approval withdrawn");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not update approval")),
  });
};
