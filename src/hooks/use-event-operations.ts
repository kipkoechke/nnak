"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventAttendeeService } from "@/services/event-attendee.service";
import { eventScannerService } from "@/services/event-scanner.service";
import { eventBookingService } from "@/services/event-booking.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateAttendeeInput, CreateScannerInput } from "@/types/nnak";

/* ── Attendees ─────────────────────────────────────────────────────── */
export const useEventAttendees = (
  eventId: string,
  params?: { page?: number; per_page?: number; search?: string; type?: string },
) =>
  useQuery({
    queryKey: nqk.eventAttendees.list(eventId, params as Record<string, unknown>),
    queryFn: () => eventAttendeeService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useCreateEventAttendee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateAttendeeInput;
    }) => eventAttendeeService.create(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventAttendees.all });
      qc.invalidateQueries({ queryKey: nqk.eventAttendance.all });
      toast.success("Attendee added");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not add attendee")),
  });
};

/* ── Scanners ──────────────────────────────────────────────────────── */
export const useEventScanners = (eventId: string) =>
  useQuery({
    queryKey: nqk.eventScanners.list(eventId),
    queryFn: () => eventScannerService.list(eventId),
    enabled: !!eventId,
  });

export const useCreateEventScanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CreateScannerInput;
    }) => eventScannerService.create(eventId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventScanners.all });
      toast.success("Scanner nominated");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not nominate scanner")),
  });
};

export const useDeleteEventScanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, scannerId }: { eventId: string; scannerId: string }) =>
      eventScannerService.remove(eventId, scannerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventScanners.all });
      toast.success("Scanner removed");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not remove scanner")),
  });
};

/* ── Bookings ──────────────────────────────────────────────────────── */
export const useEventBookings = (
  eventId: string,
  params?: { page?: number; per_page?: number; status?: string; search?: string },
) =>
  useQuery({
    queryKey: nqk.eventBookings.list(eventId, params as Record<string, unknown>),
    queryFn: () => eventBookingService.list(eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useEventBooking = (id?: string) =>
  useQuery({
    queryKey: nqk.eventBookings.detail(id ?? ""),
    queryFn: () => eventBookingService.getById(id!),
    enabled: !!id,
  });

/* ── Attendance ────────────────────────────────────────────────────── */
export const useAttendanceReport = (eventId: string) =>
  useQuery({
    queryKey: nqk.eventAttendance.report(eventId),
    queryFn: () => eventBookingService.report(eventId),
    enabled: !!eventId,
  });

export const useAttendanceScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ticketNumber,
    }: {
      eventId: string;
      ticketNumber: string;
    }) => eventBookingService.scan(eventId, ticketNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.eventAttendance.all });
      qc.invalidateQueries({ queryKey: nqk.eventAttendees.all });
    },
    onError: (e) => toast.error(extractApiError(e, "Scan failed")),
  });
};
