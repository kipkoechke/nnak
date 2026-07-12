"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventPackageService } from "@/services/event-package.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateEventPackageInput } from "@/types/nnak";

export const useEventPackages = (
  eventId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.eventPackages.list(eventId, params as Record<string, unknown>),
    queryFn: () => eventPackageService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useEventPackage = (eventId: string, id?: string) =>
  useQuery({
    queryKey: nqk.eventPackages.detail(eventId, id ?? ""),
    queryFn: () => eventPackageService.getById(eventId, id!),
    enabled: !!eventId && !!id,
  });

export const useCreateEventPackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateEventPackageInput;
    }) => eventPackageService.create(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventPackages.all });
      toast.success("Package created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create package failed")),
  });
};

export const useUpdateEventPackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      id,
      input,
    }: {
      eventId: string;
      id: string;
      input: Partial<CreateEventPackageInput>;
    }) => eventPackageService.update(eventId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventPackages.all });
      toast.success("Package updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update package failed")),
  });
};

export const useDeleteEventPackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, id }: { eventId: string; id: string }) =>
      eventPackageService.remove(eventId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventPackages.all });
      toast.success("Package deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete package failed")),
  });
};
