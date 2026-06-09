"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { byProductService } from "@/services/byproduct.service";
import { nqk } from "@/lib/query-keys";

export const useByProductUploads = () =>
  useQuery({ queryKey: nqk.byProduct.list(), queryFn: byProductService.list });

export const useByProductLines = (uploadId: string) =>
  useQuery({
    queryKey: nqk.byProduct.lines(uploadId),
    queryFn: () => byProductService.lines(uploadId),
    enabled: !!uploadId,
  });

export const useUploadByProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: byProductService.upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.byProduct.all });
      qc.invalidateQueries({ queryKey: nqk.members.all });
      qc.invalidateQueries({ queryKey: nqk.reports.kpis });
      toast.success("By-product processed");
    },
  });
};

// ── Real backend variants ────────────────────────────────────────
const apiErrMsg = (e: unknown, fb: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fb;

export const useByProductApiList = (params?: { page?: number; per_page?: number }) =>
  useQuery({
    queryKey: nqk.byProduct.list(),
    queryFn: () => byProductService.apiList(params),
  });

export const useByProductUploadStatus = (id: string | undefined) =>
  useQuery({
    queryKey: nqk.byProduct.detail(id ?? ""),
    queryFn: () => byProductService.apiGet(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      // Poll until the upload finishes processing.
      const s = (q.state.data as { status?: string } | undefined)?.status;
      return s === "processing" || s === "queued" ? 3000 : false;
    },
  });

export const useUploadByProductFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: import("@/types/nnak").ByProductUploadInput) =>
      byProductService.apiUpload(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.byProduct.all });
      qc.invalidateQueries({ queryKey: nqk.members.all });
      toast.success("By-product upload submitted");
    },
    onError: (e) => toast.error(apiErrMsg(e, "Upload failed")),
  });
};

export const useDownloadByProductTemplate = () =>
  useMutation({
    mutationFn: async () => {
      const blob = await byProductService.apiTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nnak-byproduct-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: (e) => toast.error(apiErrMsg(e, "Could not download template")),
  });
