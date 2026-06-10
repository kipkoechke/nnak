// Breakout Speaker endpoints:
//   POST /breakout-speaker                  create (link speaker to breakout room)
//   GET  /breakout-speakers?breakout_room_id= list
//   DELETE /breakout-speakers/{id}           unlink
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BreakoutSpeaker,
  CreateBreakoutSpeakerInput,
  NnakPagination,
} from "@/types/nnak";

interface BreakoutSpeakersResponse {
  success: boolean;
  data: BreakoutSpeaker[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const breakoutSpeakerService = {
  list: async (params?: { breakout_room_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<BreakoutSpeakersResponse>("/breakout-speakers", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  create: async (input: CreateBreakoutSpeakerInput): Promise<BreakoutSpeaker> =>
    unwrap<BreakoutSpeaker>(nnakApi.post("/breakout-speaker", input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/breakout-speakers/${id}`);
  },
};
