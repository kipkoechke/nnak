"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { workstationsService } from "@/services/workstations.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import { useNnakMe } from "@/hooks/use-auth";
import type { WorkstationInput } from "@/types/nnak";

// Hooks resolve the current user via useNnakMe so call-sites don't have
// to thread userId through.

export const useMyWorkstations = () => {
  const { data: me } = useNnakMe();
  const userId = me?.id ?? "";
  return useQuery({
    queryKey: nqk.workstations.list(userId),
    queryFn: () => workstationsService.list(userId),
    enabled: !!userId,
  });
};

export const useCreateWorkstation = () => {
  const qc = useQueryClient();
  const { data: me } = useNnakMe();
  const userId = me?.id ?? "";
  return useMutation({
    mutationFn: (body: WorkstationInput) => workstationsService.create(body, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.workstations.all });
      toast.success("Workstation added");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not add workstation")),
  });
};

export const useUpdateWorkstation = () => {
  const qc = useQueryClient();
  const { data: me } = useNnakMe();
  const userId = me?.id ?? "";
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<WorkstationInput> }) =>
      workstationsService.update(v.id, v.patch, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.workstations.all });
      toast.success("Workstation updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update failed")),
  });
};

export const useDeleteWorkstation = () => {
  const qc = useQueryClient();
  const { data: me } = useNnakMe();
  const userId = me?.id ?? "";
  return useMutation({
    mutationFn: (id: string) => workstationsService.remove(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.workstations.all });
      toast.success("Workstation removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete failed")),
  });
};
