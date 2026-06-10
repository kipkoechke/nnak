"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { agendaService } from "@/services/agenda.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateAgendaInput } from "@/types/nnak";

export const useAgendas = (params?: { event_id?: string; page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.agendas.list(params as Record<string, unknown>),
    queryFn: () => agendaService.list(params),
    placeholderData: (prev) => prev,
  });

export const useAgenda = (id?: string) =>
  useQuery({
    queryKey: nqk.agendas.detail(id ?? ""),
    queryFn: () => agendaService.getById(id!),
    enabled: !!id,
  });

export const useCreateAgenda = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgendaInput) => agendaService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Agenda created");
    },
    onError: (e) => toast.error(extractApiError(e, "Create agenda failed")),
  });
};

export const useUpdateAgenda = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAgendaInput> }) =>
      agendaService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Agenda updated");
    },
    onError: (e) => toast.error(extractApiError(e, "Update agenda failed")),
  });
};

export const useDeleteAgenda = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agendaService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Agenda deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete agenda failed")),
  });
};
