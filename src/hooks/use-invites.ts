"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { memberInvitesService } from "@/services/member-invites.service";
import {
  adminInvitesService,
  type AdminInviteFilters,
  type AdminTransferFilters,
} from "@/services/admin-invites.service";
import { branchManagerService } from "@/services/branch-manager.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type {
  BranchInviteCreateInput,
  BranchTransferCreateInput,
} from "@/types/nnak";

// ── Member portal ──────────────────────────────────────────────
export const useMyInvites = (params: { status?: string } = {}) =>
  useQuery({
    queryKey: nqk.invites.memberList(params),
    queryFn: () => memberInvitesService.list(params),
    refetchOnWindowFocus: false,
  });

export const useAcceptInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: memberInvitesService.accept,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.invites.memberAll });
      qc.invalidateQueries({ queryKey: nqk.auth.me });
      qc.invalidateQueries({ queryKey: nqk.memberDashboard });
      toast.success("Invite accepted");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not accept invite")),
  });
};

export const useRejectInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: memberInvitesService.reject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.invites.memberAll });
      toast.success("Invite declined");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not reject invite")),
  });
};

// ── Branch manager ─────────────────────────────────────────────
export const useBranchSentInvites = (params: { status?: string } = {}) =>
  useQuery({
    queryKey: nqk.invites.branchSent(params),
    queryFn: () => branchManagerService.listSentInvites(params),
    refetchOnWindowFocus: false,
  });

export const useBranchReceivedTransfers = (
  params: { status?: string } = {},
) =>
  useQuery({
    queryKey: nqk.invites.branchTransfersReceived(params),
    queryFn: () => branchManagerService.listReceivedTransfers(params),
    refetchOnWindowFocus: false,
  });

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchInviteCreateInput) =>
      branchManagerService.inviteMember(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Invite sent");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not send invite")),
  });
};

export const useTransferMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BranchTransferCreateInput) =>
      branchManagerService.transferMember(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Transfer requested");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not request transfer")),
  });
};

export const useAcceptTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchManagerService.acceptTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Transfer accepted");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not accept transfer")),
  });
};

export const useRejectTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: branchManagerService.rejectTransfer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nnak", "branch"] });
      toast.success("Transfer rejected");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not reject transfer")),
  });
};

// ── Admin views ────────────────────────────────────────────────
export const useAdminBranchInvites = (params: AdminInviteFilters = {}) =>
  useQuery({
    queryKey: nqk.invites.adminInvites(params as Record<string, unknown>),
    queryFn: () => adminInvitesService.listInvites(params),
    refetchOnWindowFocus: false,
  });

export const useAdminBranchTransfers = (params: AdminTransferFilters = {}) =>
  useQuery({
    queryKey: nqk.invites.adminTransfers(params as Record<string, unknown>),
    queryFn: () => adminInvitesService.listTransfers(params),
    refetchOnWindowFocus: false,
  });
