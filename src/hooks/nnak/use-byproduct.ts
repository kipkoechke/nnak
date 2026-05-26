"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { byProductService } from "@/services/nnak/byproduct.service";
import { nqk } from "@/lib/nnak/query-keys";

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
