"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminsService } from "@/services/admins.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";

export const useAdmins = () =>
  useQuery({ queryKey: nqk.admins.list(), queryFn: adminsService.list });

export const useCreateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.admins.all });
      toast.success("Admin created");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not create admin")),
  });
};
