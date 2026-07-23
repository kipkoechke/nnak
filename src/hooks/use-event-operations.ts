"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { eventAttendeeService } from "@/services/event-attendee.service";
import { eventScannerService } from "@/services/event-scanner.service";
import { eventBookingService } from "@/services/event-booking.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type {
  AttendanceType,
  CreateAttendeeInput,
  CreateScannerInput,
  EventReadScope,
} from "@/types/nnak";

/* ── Attendees ─────────────────────────────────────────────────────── */
export const useEventAttendees = (
  eventId: string,
  params?: { page?: number; per_page?: number; search?: string },
  scope: EventReadScope = "admin",
) =>
  useQuery({
    queryKey: nqk.eventAttendees.list(
      scope,
      eventId,
      params as Record<string, unknown>,
    ),
    queryFn: () => eventAttendeeService.list(scope, eventId, params),
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
    onSuccess: (attendee) => {
      qc.invalidateQueries({ queryKey: nqk.eventAttendees.all });
      qc.invalidateQueries({ queryKey: nqk.eventAttendance.all });
      toast.success(
        attendee.ticket_sent
          ? "Attendee added — ticket emailed"
          : "Attendee added",
      );
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
    onError: (e) =>
      toast.error(extractApiError(e, "Could not nominate scanner")),
  });
};

export const useDeleteEventScanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      scannerId,
    }: {
      eventId: string;
      scannerId: string;
    }) => eventScannerService.remove(eventId, scannerId),
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
  params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  },
  scope: EventReadScope = "admin",
) =>
  useQuery({
    queryKey: nqk.eventBookings.list(
      scope,
      eventId,
      params as Record<string, unknown>,
    ),
    queryFn: () => eventBookingService.list(scope, eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

export const useEventBooking = (
  id?: string,
  scope: EventReadScope = "admin",
) =>
  useQuery({
    queryKey: nqk.eventBookings.detail(scope, id ?? ""),
    queryFn: () => eventBookingService.getById(scope, id!),
    enabled: !!id,
  });

/* ── Attendance ────────────────────────────────────────────────────── */
export const useAttendanceReport = (
  eventId: string,
  params?: {
    page?: number;
    per_page?: number;
    type?: AttendanceType;
    agenda_id?: string;
  },
  scope: EventReadScope = "admin",
) =>
  useQuery({
    queryKey: nqk.eventAttendance.report(
      scope,
      eventId,
      params as Record<string, unknown>,
    ),
    queryFn: () => eventBookingService.report(scope, eventId, params),
    enabled: !!eventId,
    placeholderData: (prev) => prev,
  });

/**
 * Reads an attendee's scan history before committing a scan, so the desk can
 * see a duplicate arrival coming. Only fetches once a ticket has been entered.
 */
export const useAttendanceLookup = (eventId: string, ticketNumber: string) =>
  useQuery({
    queryKey: nqk.eventAttendance.lookup(eventId, ticketNumber),
    queryFn: () => eventBookingService.lookup(eventId, ticketNumber),
    enabled: !!eventId && !!ticketNumber,
    retry: false,
  });

export const useAttendanceScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      ...body
    }: {
      eventId: string;
      ticket_number: string;
      agenda_id?: string;
      type?: AttendanceType;
    }) => eventBookingService.scan(eventId, body),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: nqk.eventAttendance.all });
      qc.invalidateQueries({ queryKey: nqk.eventAttendees.all });
      toast.success(`${r.name} — ${r.type} recorded`);
    },
    onError: (e) => toast.error(extractApiError(e, "Scan failed")),
  });
};
