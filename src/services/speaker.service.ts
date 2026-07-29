// Speaker endpoints (nested under event):
//   GET  /events/{event}/speakers           list (paginated)
//   POST /events/{event}/speakers           create
//   GET  /events/{event}/speakers/{id}      detail
//   PATCH  /events/{event}/speakers/{id}     update
//   DELETE /events/{event}/speakers/{id}    delete
import { nnakApi } from "@/lib/api";
import { MULTIPART_HEADERS, hasFileValue, toFormData } from "@/lib/multipart";
import type {
  ApiEnvelope,
  CreateSpeakerInput,
  NnakPagination,
  Speaker,
} from "@/types/nnak";

interface SpeakersResponse {
  success: boolean;
  data: Speaker[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

const base = (eventId: string) => `/admin/events/${eventId}/speakers`;

export const speakerService = {
  list: async (
    eventId: string,
    params?: { page?: number; per_page?: number },
  ) => {
    const r = await nnakApi.get<SpeakersResponse>(base(eventId), { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (eventId: string, id: string) =>
    unwrap<Speaker>(nnakApi.get(`${base(eventId)}/${id}`)),

  /** Goes out as multipart only when a photo file was picked. */
  create: async (
    eventId: string,
    input: CreateSpeakerInput,
  ): Promise<Speaker> =>
    hasFileValue(input)
      ? unwrap<Speaker>(
          nnakApi.post(base(eventId), toFormData(input), MULTIPART_HEADERS),
        )
      : unwrap<Speaker>(nnakApi.post(base(eventId), input)),

  update: async (
    eventId: string,
    id: string,
    input: Partial<CreateSpeakerInput>,
  ): Promise<Speaker> =>
    hasFileValue(input)
      ? // PHP does not parse an upload on a real PATCH — spoof it.
        unwrap<Speaker>(
          nnakApi.post(
            `${base(eventId)}/${id}`,
            toFormData(input, { method: "PATCH" }),
            MULTIPART_HEADERS,
          ),
        )
      : unwrap<Speaker>(nnakApi.patch(`${base(eventId)}/${id}`, input)),

  remove: async (eventId: string, id: string) => {
    await nnakApi.delete(`${base(eventId)}/${id}`);
  },
};
