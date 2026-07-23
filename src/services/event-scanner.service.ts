// Event scanner endpoints:
//   GET    /admin/events/{event}/scanners             list nominated scanners
//   POST   /admin/events/{event}/scanners             nominate a scanner
//   DELETE /admin/events/{event}/scanners/{scannerId} remove a scanner
import { nnakApi } from "@/lib/api";
import type { ApiEnvelope, CreateScannerInput, EventScanner } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/scanners`;

export const eventScannerService = {
  /** The list is not paginated — it arrives wrapped as `data.scanners`. */
  list: async (eventId: string): Promise<EventScanner[]> => {
    const r = await unwrap<{ scanners: EventScanner[] }>(
      nnakApi.get(base(eventId)),
    );
    return r?.scanners ?? [];
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
