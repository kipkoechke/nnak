"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { categoriesService } from "@/services/nnak/categories.service";
import { nqk } from "@/lib/nnak/query-keys";
import type { MemberCategory } from "@/types/nnak";

export const useCategories = () =>
  useQuery({ queryKey: nqk.categories.list(), queryFn: categoriesService.list });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.categories.all });
      toast.success("Category created");
    },
  });
};
export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<MemberCategory> }) =>
      categoriesService.update(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.categories.all });
      toast.success("Category updated");
    },
  });
};
export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.categories.all });
      toast.success("Category deleted");
    },
  });
};
