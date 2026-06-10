"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { breakoutRoomService } from "@/services/breakout-room.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateBreakoutRoomInput } from "@/types/nnak";

export const useBreakoutRooms = (params?: { agenda_id?: string; page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.breakoutRooms.list(params as Record<string, unknown>),
    queryFn: () => breakoutRoomService.list(params),
    placeholderData: (prev) => prev,
  });

export const useBreakoutRoom = (id?: string) =>
  useQuery({
    queryKey: nqk.breakoutRooms.detail(id ?? ""),
    queryFn: () => breakoutRoomService.getById(id!),
    enabled: !!id,
  });

export const useCreateBreakoutRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBreakoutRoomInput) => breakoutRoomService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create breakout room failed")),
  });
};

export const useUpdateBreakoutRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateBreakoutRoomInput> }) =>
      breakoutRoomService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update breakout room failed")),
  });
};

export const useDeleteBreakoutRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => breakoutRoomService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Breakout room deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete breakout room failed")),
  });
};
