// Exhibitor endpoints (nested under event):
//   GET  /events/{event}/exhibitors         list
//   POST /events/{event}/exhibitors         create
//   GET  /events/{event}/exhibitors/{id}    detail
//   PUT   /events/{event}/exhibitors/{id}   update
//   DELETE /events/{event}/exhibitors/{id}  delete
import { nnakApi } from "@/lib/api";
import { MULTIPART_HEADERS, hasFileValue, toFormData } from "@/lib/multipart";
import type {
  ApiEnvelope,
  CreateExhibitorInput,
  Exhibitor,
  NnakPagination,
} from "@/types/nnak";

interface ExhibitorsResponse {
  success: boolean;
  data: Exhibitor[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/exhibitors`;

export const exhibitorService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<ExhibitorsResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<Exhibitor>(nnakApi.get(`${base(eventId)}/${id}`)),

  /** Goes out as multipart only when a logo file was picked. */
  create: async (
    eventId: string,
    input: CreateExhibitorInput,
  ): Promise<Exhibitor> =>
    hasFileValue(input)
      ? unwrap<Exhibitor>(
          nnakApi.post(base(eventId), toFormData(input), MULTIPART_HEADERS),
        )
      : unwrap<Exhibitor>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateExhibitorInput>,
  ): Promise<Exhibitor> =>
    hasFileValue(input)
      ? // PHP does not parse an upload on a real PUT — spoof it.
        unwrap<Exhibitor>(
          nnakApi.post(
            `${base(eventId)}/${id}`,
            toFormData(input, { method: "PUT" }),
            MULTIPART_HEADERS,
          ),
        )
      : unwrap<Exhibitor>(nnakApi.put(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
