"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorService } from "@/services/sponsor.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateSponsorInput } from "@/types/nnak";

export const useSponsors = (params?: { event_id?: string; page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.sponsors.list(params as Record<string, unknown>),
    queryFn: () => sponsorService.list(params),
    placeholderData: (prev) => prev,
  });

export const useSponsor = (id?: string) =>
  useQuery({
    queryKey: nqk.sponsors.detail(id ?? ""),
    queryFn: () => sponsorService.getById(id!),
    enabled: !!id,
  });

export const useCreateSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSponsorInput) => sponsorService.create(input),
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
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateSponsorInput> }) =>
      sponsorService.update(id, input),
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
    mutationFn: (id: string) => sponsorService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.sponsors.all });
      toast.success("Sponsor deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete sponsor failed")),
  });
};
