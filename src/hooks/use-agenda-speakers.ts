"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { agendaSpeakerService } from "@/services/agenda-speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateAgendaSpeakerInput } from "@/types/nnak";

export const useAgendaSpeakers = (
  eventId: string,
  agendaId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.agendaSpeakers.list(
      eventId,
      agendaId,
      params as Record<string, unknown>,
    ),
    queryFn: () => agendaSpeakerService.list(eventId, agendaId, params),
    enabled: !!eventId && !!agendaId,
    placeholderData: (prev) => prev,
  });

export const useCreateAgendaSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      agendaId,
      input,
    }: {
      eventId: string;
      agendaId: string;
      input: CreateAgendaSpeakerInput;
    }) => agendaSpeakerService.create(eventId, agendaId, input),
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
    mutationFn: ({
      eventId,
      agendaId,
      id,
    }: {
      eventId: string;
      agendaId: string;
      id: string;
    }) => agendaSpeakerService.remove(eventId, agendaId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendaSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Speaker unlinked");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not unlink speaker")),
  });
};
