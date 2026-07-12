// Event scanner endpoints:
//   GET    /admin/events/{event}/scanners             list nominated scanners
//   POST   /admin/events/{event}/scanners             nominate a scanner
//   DELETE /admin/events/{event}/scanners/{scannerId} remove a scanner
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  CreateScannerInput,
  EventScanner,
  NnakPagination,
} from "@/types/nnak";

interface ScannersResponse {
  success: boolean;
  data: EventScanner[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/scanners`;

export const eventScannerService = {
  list: async (eventId: string) => {
    const r = await nnakApi.get<ScannersResponse>(base(eventId));
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: async (
    eventId: string,
    input: CreateScannerInput,
  ): Promise<EventScanner> =>
    unwrap<EventScanner>(nnakApi.post(base(eventId), input)),

  remove: async (eventId: string, scannerId: string) => {
    await nnakApi.delete(`${base(eventId)}/${scannerId}`);
  },
};
