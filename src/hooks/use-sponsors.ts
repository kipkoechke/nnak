"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorService } from "@/services/sponsor.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateSponsorInput } from "@/types/nnak";

export const useSponsors = (
  eventId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.sponsors.list(eventId, params as Record<string, unknown>),
    queryFn: () => sponsorService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useSponsor = (eventId: string, id?: string) =>
  useQuery({
    queryKey: nqk.sponsors.detail(eventId, id ?? ""),
    queryFn: () => sponsorService.getById(eventId, id!),
    enabled: !!eventId && !!id,
  });

export const useCreateSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateSponsorInput;
    }) => sponsorService.create(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.sponsors.all });
      toast.success("Sponsor created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create sponsor failed")),
  });
};

export const useUpdateSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      id,
      input,
    }: {
      eventId: string;
      id: string;
      input: Partial<CreateSponsorInput>;
    }) => sponsorService.update(eventId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.sponsors.all });
      toast.success("Sponsor updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update sponsor failed")),
  });
};

export const useDeleteSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, id }: { eventId: string; id: string }) =>
      sponsorService.remove(eventId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.sponsors.all });
      toast.success("Sponsor deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete sponsor failed")),
  });
};
