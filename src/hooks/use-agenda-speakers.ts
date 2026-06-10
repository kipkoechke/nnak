"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { agendaSpeakerService } from "@/services/agenda-speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateAgendaSpeakerInput } from "@/types/nnak";

export const useAgendaSpeakers = (params?: {
  agenda_id?: string;
  page?: number;
  per_page?: number;
}) =>
  useQuery({
    queryKey: nqk.agendaSpeakers.list(params as Record<string, unknown>),
    queryFn: () => agendaSpeakerService.list(params),
    enabled: !!params?.agenda_id,
    placeholderData: (prev) => prev,
  });

export const useCreateAgendaSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgendaSpeakerInput) =>
      agendaSpeakerService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendaSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Speaker linked to agenda");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not link speaker to agenda")),
  });
};

export const useDeleteAgendaSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaSpeakerService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendaSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Speaker unlinked");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not unlink speaker")),
  });
};
