// Sponsor / Partner endpoints:
//   GET  /sponsors?event_id=       list
//   POST /sponsors                  create
//   GET  /sponsors/{id}             detail
//   PATCH /sponsors/{id}            update
//   DELETE /sponsors/{id}           delete
import { nnakApi } from "@/lib/api";
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

export const sponsorService = {
  list: async (params?: { event_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<SponsorsResponse>("/sponsors", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<Sponsor>(nnakApi.get(`/sponsors/${id}`)),

  create: async (input: CreateSponsorInput): Promise<Sponsor> =>
    unwrap<Sponsor>(nnakApi.post("/sponsors", input)),

  update: async (id: string, input: Partial<CreateSponsorInput>): Promise<Sponsor> =>
    unwrap<Sponsor>(nnakApi.patch(`/sponsors/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/sponsors/${id}`);
  },
};
