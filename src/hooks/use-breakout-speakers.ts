"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { breakoutSpeakerService } from "@/services/breakout-speaker.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateBreakoutSpeakerInput } from "@/types/nnak";

export const useBreakoutSpeakers = (params?: {
  breakout_room_id?: string;
  page?: number;
  per_page?: number;
}) =>
  useQuery({
    queryKey: nqk.breakoutSpeakers.list(params as Record<string, unknown>),
    queryFn: () => breakoutSpeakerService.list(params),
    enabled: !!params?.breakout_room_id,
    placeholderData: (prev) => prev,
  });

export const useCreateBreakoutSpeaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBreakoutSpeakerInput) =>
      breakoutSpeakerService.create(input),
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
    mutationFn: (id: string) => breakoutSpeakerService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.breakoutSpeakers.all });
      qc.invalidateQueries({ queryKey: nqk.breakoutRooms.all });
      toast.success("Speaker unlinked");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not unlink speaker")),
  });
};
