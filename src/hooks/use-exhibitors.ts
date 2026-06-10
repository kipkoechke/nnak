"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { exhibitorService } from "@/services/exhibitor.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateExhibitorInput } from "@/types/nnak";

export const useExhibitors = (params?: { event_id?: string; page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.exhibitors.list(params as Record<string, unknown>),
    queryFn: () => exhibitorService.list(params),
    placeholderData: (prev) => prev,
  });

export const useExhibitor = (id?: string) =>
  useQuery({
    queryKey: nqk.exhibitors.detail(id ?? ""),
    queryFn: () => exhibitorService.getById(id!),
    enabled: !!id,
  });

export const useCreateExhibitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExhibitorInput) => exhibitorService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.exhibitors.all });
      toast.success("Exhibitor created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create exhibitor failed")),
  });
};

export const useUpdateExhibitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateExhibitorInput> }) =>
      exhibitorService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.exhibitors.all });
      toast.success("Exhibitor updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update exhibitor failed")),
  });
};

export const useDeleteExhibitor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exhibitorService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.exhibitors.all });
      toast.success("Exhibitor deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete exhibitor failed")),
  });
};
