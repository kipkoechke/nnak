// Agenda-Speaker endpoints:
//   POST /agenda-speakers           create (link speaker to agenda)
//   GET  /agenda-speakers?agenda_id= list
//   DELETE /agenda-speakers/{id}    unlink
import { nnakApi } from "@/lib/api";
import type {
  AgendaSpeaker,
  ApiEnvelope,
  CreateAgendaSpeakerInput,
  NnakPagination,
} from "@/types/nnak";

interface AgendaSpeakersResponse {
  success: boolean;
  data: AgendaSpeaker[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const agendaSpeakerService = {
  list: async (params?: { agenda_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<AgendaSpeakersResponse>("/agenda-speakers", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: async (input: CreateAgendaSpeakerInput): Promise<AgendaSpeaker> =>
    unwrap<AgendaSpeaker>(nnakApi.post("/agenda-speakers", input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/agenda-speakers/${id}`);
  },
};
