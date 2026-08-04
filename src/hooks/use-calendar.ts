"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  calendarService,
  type CalendarQuery,
} from "@/services/calendar.service";
import { nqk } from "@/lib/query-keys";
import { extractApiError } from "@/lib/extract-api-error";
import type { CreateCalendarEntryInput } from "@/types/nnak";

/** Public read — approved events merged with calendar entries. */
export const useCalendar = (params: CalendarQuery = {}) =>
  useQuery({
    queryKey: nqk.calendar.list(params as Record<string, unknown>),
    queryFn: () => calendarService.list(params),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

export const useCreateCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCalendarEntryInput) =>
      calendarService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.calendar.all });
      toast.success("Calendar entry added");
    },
    onError: (e) => toast.error(extractApiError(e, "Could not add the entry")),
  });
};

export const useUpdateCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CreateCalendarEntryInput>;
    }) => calendarService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.calendar.all });
      toast.success("Calendar entry updated");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not update the entry")),
  });
};

export const useDeleteCalendarEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: nqk.calendar.all });
      toast.success("Calendar entry removed");
    },
    onError: (e) =>
      toast.error(extractApiError(e, "Could not remove the entry")),
  });
};
