"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { speakerService } from "@/services/speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateSpeakerInput } from "@/types/nnak";

export const useSpeakers = (
  eventId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.speakers.list(eventId, params as Record<string, unknown>),
    queryFn: () => speakerService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useSpeaker = (eventId: string, id?: string) =>
  useQuery({
    queryKey: nqk.speakers.detail(eventId, id ?? ""),
    queryFn: () => speakerService.getById(eventId, id!),
    enabled: !!eventId && !!id,
  });

export const useCreateSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateSpeakerInput;
    }) => speakerService.create(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.speakers.all });
      toast.success("Speaker created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create speaker failed")),
  });
};

export const useUpdateSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      id,
      input,
    }: {
      eventId: string;
      id: string;
      input: Partial<CreateSpeakerInput>;
    }) => speakerService.update(eventId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.speakers.all });
      toast.success("Speaker updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update speaker failed")),
  });
};

export const useDeleteSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, id }: { eventId: string; id: string }) =>
      speakerService.remove(eventId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.speakers.all });
      toast.success("Speaker deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete speaker failed")),
  });
};
