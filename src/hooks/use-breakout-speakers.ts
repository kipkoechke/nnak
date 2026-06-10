"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { breakoutSpeakerService } from "@/services/breakout-speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateBreakoutSpeakerInput } from "@/types/nnak";

export const useBreakoutSpeakers = (
  eventId: string,
  agendaId: string,
  breakoutRoomId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.breakoutSpeakers.list(
      eventId,
      agendaId,
      breakoutRoomId,
      params as Record<string, unknown>,
    ),
    queryFn: () =>
      breakoutSpeakerService.list(eventId, agendaId, breakoutRoomId, params),
    enabled: !!eventId && !!agendaId && !!breakoutRoomId,
    placeholderData: (prev) => prev,
  });

export const useCreateBreakoutSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      agendaId,
      breakoutRoomId,
      input,
    }: {
      eventId: string;
      agendaId: string;
      breakoutRoomId: string;
      input: CreateBreakoutSpeakerInput;
    }) =>
      breakoutSpeakerService.create(eventId, agendaId, breakoutRoomId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Speaker linked to breakout room");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not link speaker to breakout")),
  });
};

export const useDeleteBreakoutSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      agendaId,
      breakoutRoomId,
      id,
    }: {
      eventId: string;
      agendaId: string;
      breakoutRoomId: string;
      id: string;
    }) => breakoutSpeakerService.remove(eventId, agendaId, breakoutRoomId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Speaker unlinked");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not unlink speaker")),
  });
};
