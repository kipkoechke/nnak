"use client";
import { useQuery } from "@tanstack/react-query";
import { studentEventsService } from "@/services/student-events.service";
import { nqk } from "@/lib/query-keys";

export const useStudentEvents = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}) =>
  useQuery({
    queryKey: nqk.studentEvents.list(params),
    queryFn: () => studentEventsService.list(params),
    staleTime: 30_000,
  });

export const useStudentEvent = (id: string) =>
  useQuery({
    queryKey: nqk.studentEvents.detail(id),
    queryFn: () => studentEventsService.detail(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useStudentEventPackages = (id: string) =>
  useQuery({
    queryKey: nqk.studentEvents.packages(id),
    queryFn: () => studentEventsService.packages(id),
    enabled: !!id,
    staleTime: 60_000,
  });

export const useStudentBookings = (params?: {
  page?: number;
  per_page?: number;
  status?: string;
}) =>
  useQuery({
    queryKey: nqk.studentBookings.list(params),
    queryFn: () => studentEventsService.bookings(params),
    staleTime: 30_000,
  });

export const useStudentBooking = (id: string) =>
  useQuery({
    queryKey: nqk.studentBookings.detail(id),
    queryFn: () => studentEventsService.bookingDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  });
