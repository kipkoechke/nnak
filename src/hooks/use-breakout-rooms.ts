"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { breakoutRoomService } from "@/services/breakout-room.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateBreakoutRoomInput } from "@/types/nnak";

export const useBreakoutRooms = (
  eventId: string,
  agendaId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.breakoutRooms.list(
      eventId,
      agendaId,
      params as Record<string, unknown>,
    ),
    queryFn: () => breakoutRoomService.list(eventId, agendaId, params),
    enabled: !!eventId && !!agendaId,
    placeholderData: (prev) => prev,
  });

export const useBreakoutRoom = (
  eventId: string,
  agendaId: string,
  id?: string,
) =>
  useQuery({
    queryKey: nqk.breakoutRooms.detail(eventId, agendaId, id ?? ""),
    queryFn: () => breakoutRoomService.getById(eventId, agendaId, id!),
    enabled: !!eventId && !!agendaId && !!id,
  });

export const useCreateBreakoutRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      agendaId,
      input,
    }: {
      eventId: string;
      agendaId: string;
      input: CreateBreakoutRoomInput;
    }) => breakoutRoomService.create(eventId, agendaId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room created");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Create breakout room failed")),
  });
};

export const useUpdateBreakoutRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      agendaId,
      id,
      input,
    }: {
      eventId: string;
      agendaId: string;
      id: string;
      input: Partial<CreateBreakoutRoomInput>;
    }) => breakoutRoomService.update(eventId, agendaId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room updated");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Update breakout room failed")),
  });
};

export const useDeleteBreakoutRoom = () => {
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
    }) => breakoutRoomService.remove(eventId, agendaId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room deleted");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Delete breakout room failed")),
  });
};
