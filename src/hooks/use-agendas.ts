"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { agendaService } from "@/services/agenda.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateAgendaInput } from "@/types/nnak";

export const useAgendas = (
  eventId: string,
  params?: { page?: number; per_page?: number },
) =>
  useQuery({
    queryKey: nqk.agendas.list(eventId, params as Record<string, unknown>),
    queryFn: () => agendaService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useAgenda = (eventId: string, id?: string) =>
  useQuery({
    queryKey: nqk.agendas.detail(eventId, id ?? ""),
    queryFn: () => agendaService.getById(eventId, id!),
    enabled: !!eventId && !!id,
  });

export const useCreateAgenda = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateAgendaInput;
    }) => agendaService.create(eventId, input),
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
    mutationFn: ({
      eventId,
      id,
      input,
    }: {
      eventId: string;
      id: string;
      input: Partial<CreateAgendaInput>;
    }) => agendaService.update(eventId, id, input),
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
    mutationFn: ({ eventId, id }: { eventId: string; id: string }) =>
      agendaService.remove(eventId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.agendas.all });
      toast.success("Agenda deleted");
    },
    onError: (e) => toast.error(extractApiError(e, "Delete agenda failed")),
  });
};
