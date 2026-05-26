"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ilmService } from "@/services/ilm.service";
import { nqk } from "@/lib/query-keys";

export const useAuditLog = (p: { page?: number; per_page?: number } = {}) =>
  useQuery({ queryKey: nqk.ilm.audit(p), queryFn: () => ilmService.audit(p), placeholderData: (prev) => prev });

export const useDataExports = () =>
  useQuery({ queryKey: nqk.ilm.exports, queryFn: ilmService.exports.list });

export const useRequestExport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ilmService.exports.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.ilm.exports });
      toast.success("Export requested — awaiting approval");
    },
  });
};

export const useDecideExport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; approver: string; approve: boolean }) =>
      ilmService.exports.decide(v.id, v.approver, v.approve),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.ilm.exports });
      toast.success("Updated");
    },
  });
};

export const useErasures = () =>
  useQuery({ queryKey: nqk.ilm.erasures, queryFn: ilmService.erasures.list });

export const useRequestErasure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ilmService.erasures.request,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.ilm.erasures });
      toast.success("Erasure request submitted");
    },
  });
};

export const useCompleteErasure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ilmService.erasures.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.ilm.erasures });
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("Member anonymised");
    },
  });
};
