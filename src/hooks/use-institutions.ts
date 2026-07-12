"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  institutionsService,
  type CreateInstitutionInput,
  type InstitutionListParams,
} from "@/services/institutions.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";

export const useInstitutions = (params?: InstitutionListParams) =>
  useQuery({
    queryKey: nqk.institutions.list(params as Record<string, unknown>),
    queryFn: () => institutionsService.list(params),
    staleTime: 300_000,
  });

// ── Admin management ────────────────────────────────────────────────
export const useAdminInstitutions = (params?: InstitutionListParams) =>
  useQuery({
    queryKey: [...nqk.institutions.all, "admin", params ?? {}],
    queryFn: () => institutionsService.adminList(params),
    placeholderData: (prev) => prev,
  });

export const useCreateInstitution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInstitutionInput) =>
      institutionsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.institutions.all });
      toast.success("Institution created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create failed")),
  });
};

export const useUpdateInstitution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; input: Partial<CreateInstitutionInput> }) =>
      institutionsService.update(v.id, v.input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.institutions.all });
      toast.success("Institution updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update failed")),
  });
};

export const useDeleteInstitution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => institutionsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.institutions.all });
      toast.success("Institution deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete failed")),
  });
};
