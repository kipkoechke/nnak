// Sponsor / Partner endpoints (nested under event):
//   GET  /events/{event}/sponsors           list
//   POST /events/{event}/sponsors           create
//   GET  /events/{event}/sponsors/{id}      detail
//   PATCH  /events/{event}/sponsors/{id}     update
//   DELETE /events/{event}/sponsors/{id}    delete
import { nnakApi } from "@/lib/api";
import { MULTIPART_HEADERS, hasFileValue, toFormData } from "@/lib/multipart";
import type {
  ApiEnvelope,
  CreateSponsorInput,
  NnakPagination,
  Sponsor,
} from "@/types/nnak";

interface SponsorsResponse {
  success: boolean;
  data: Sponsor[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/sponsors`;

export const sponsorService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<SponsorsResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<Sponsor>(nnakApi.get(`${base(eventId)}/${id}`)),

  /** Goes out as multipart only when a logo file was picked. */
  create: async (
    eventId: string,
    input: CreateSponsorInput,
  ): Promise<Sponsor> =>
    hasFileValue(input)
      ? unwrap<Sponsor>(
          nnakApi.post(base(eventId), toFormData(input), MULTIPART_HEADERS),
        )
      : unwrap<Sponsor>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateSponsorInput>,
  ): Promise<Sponsor> =>
    hasFileValue(input)
      ? // PHP does not parse an upload on a real PATCH — spoof it.
        unwrap<Sponsor>(
          nnakApi.post(
            `${base(eventId)}/${id}`,
            toFormData(input, { method: "PATCH" }),
            MULTIPART_HEADERS,
          ),
        )
      : unwrap<Sponsor>(nnakApi.patch(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
