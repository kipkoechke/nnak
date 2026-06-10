"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { speakerService } from "@/services/speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateSpeakerInput } from "@/types/nnak";

export const useSpeakers = (params?: { event_id?: string; page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.speakers.list(params as Record<string, unknown>),
    queryFn: () => speakerService.list(params),
    placeholderData: (prev) => prev,
  });

export const useSpeaker = (id?: string) =>
  useQuery({
    queryKey: nqk.speakers.detail(id ?? ""),
    queryFn: () => speakerService.getById(id!),
    enabled: !!id,
  });

export const useCreateSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSpeakerInput) => speakerService.create(input),
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
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSpeakerInput> }) =>
      speakerService.update(id, input),
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
    mutationFn: (id: string) => speakerService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.speakers.all });
      toast.success("Speaker deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete speaker failed")),
  });
};
