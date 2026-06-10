// Breakout Room endpoints:
//   GET  /breakout-rooms?agenda_id=  list
//   POST /breakout-rooms              create
//   GET  /breakout-rooms/{id}         detail
//   PATCH /breakout-rooms/{id}        update
//   DELETE /breakout-rooms/{id}       delete
import { nnakApi } from "@/lib/api";
import type {
  ApiEnvelope,
  BreakoutRoom,
  CreateBreakoutRoomInput,
  NnakPagination,
} from "@/types/nnak";

interface BreakoutRoomsResponse {
  success: boolean;
  data: BreakoutRoom[];
  pagination?: NnakPagination;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const breakoutRoomService = {
  list: async (params?: { agenda_id?: string; page?: number; per_page?: number }) => {
    const r = await nnakApi.get<BreakoutRoomsResponse>("/breakout-rooms", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },

  getById: async (id: string) =>
    unwrap<BreakoutRoom>(nnakApi.get(`/breakout-rooms/${id}`)),

  create: async (input: CreateBreakoutRoomInput): Promise<BreakoutRoom> =>
    unwrap<BreakoutRoom>(nnakApi.post("/breakout-rooms", input)),

  update: async (id: string, input: Partial<CreateBreakoutRoomInput>): Promise<BreakoutRoom> =>
    unwrap<BreakoutRoom>(nnakApi.patch(`/breakout-rooms/${id}`, input)),

  remove: async (id: string) => {
    await nnakApi.delete(`/breakout-rooms/${id}`);
  },
};
