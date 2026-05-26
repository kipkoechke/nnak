"use client";
import { useQuery } from "@tanstack/react-query";
import { nnakBranchesService } from "@/services/nnak/branches.service";
import { nqk } from "@/lib/nnak/query-keys";

export const useNnakBranches = () =>
  useQuery({ queryKey: nqk.branches.list(), queryFn: nnakBranchesService.list });
