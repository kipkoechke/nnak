"use client";
import { useQuery } from "@tanstack/react-query";
import { nnakBranchesService } from "@/services/branches.service";
import { nqk } from "@/lib/query-keys";

export const useNnakBranches = () =>
  useQuery({ queryKey: nqk.branches.list(), queryFn: nnakBranchesService.list });
