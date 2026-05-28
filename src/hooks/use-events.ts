"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventsService } from "@/services/events.service";
import { nqk } from "@/lib/query-keys";
import type { NnakEvent } from "@/types/nnak";

export const useEvents = (p: { page?: number; per_page?: number; status?: string } = {}) =>
  useQuery({
    queryKey: nqk.events.list(p),
    queryFn: () => eventsService.list(p),
    placeholderData: (prev) => prev,
  });

export const useEvent = (id: string) =>
  useQuery({
    queryKey: nqk.events.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
  });

export const useEventRegistrants = (id: string) =>
  useQuery({
    queryKey: nqk.events.registrants(id),
    queryFn: () => eventsService.registrants(id),
    enabled: !!id,
  });

export const useMyRegistrations = (userId: string | undefined) =>
  useQuery({
    queryKey: [...nqk.events.all, "mine", userId ?? ""],
    queryFn: () => eventsService.myRegistrations(userId!),
    enabled: !!userId,
  });

export const useUpsertEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NnakEvent> & { id?: string }) => eventsService.upsert(input),
    onSuccess: (e) => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      qc.invalidateQueries({ queryKey: nqk.events.detail(e.id) });
      toast.success("Event saved");
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.events.all });
      toast.success("Event deleted");
    },
  });
};

export const useRegisterForEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { eventId: string; userId: string; fee: number }) =>
      eventsService.register(v.eventId, v.userId, v.fee),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: nqk.events.detail(v.eventId) });
      qc.invalidateQueries({ queryKey: nqk.events.registrants(v.eventId) });
      toast.success("Registered");
    },
  });
};

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qrToken: string) => eventsService.checkIn(qrToken),
    onSuccess: (reg) => {
      qc.invalidateQueries({ queryKey: nqk.events.registrants(reg.event_id) });
      toast.success("Attendee checked in");
    },
    onError: () => toast.error("Invalid QR code"),
  });
};

export const useIssueCertificate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsService.issueCertificate,
    onSuccess: (reg) => {
      qc.invalidateQueries({ queryKey: nqk.events.registrants(reg.event_id) });
      toast.success("Certificate issued");
    },
  });
};
