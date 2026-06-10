// Speaker endpoints:
//   GET  /speakers?event_id=      list (paginated)
//   POST /speakers                 create
//   GET  /speakers/{id}            detail
//   PATCH /speakers/{id}           update
//   DELETE /speakers/{id}          delete
import { nnakApi } from "@/lib/api";
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

export const speakerService = {
  list: async (params?: { event_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<SpeakersResponse>("/speakers", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<Speaker>(nnakApi.get(`/speakers/${id}`)),

  create: async (input: CreateSpeakerInput): Promise<Speaker> =>
    unwrap<Speaker>(nnakApi.post("/speakers", input)),

  update: async (id: string, input: Partial<CreateSpeakerInput>): Promise<Speaker> =>
    unwrap<Speaker>(nnakApi.patch(`/speakers/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/speakers/${id}`);
  },
};
