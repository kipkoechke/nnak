// Member workstations (employer history): /member/workstations
//   GET    /member/workstations           -> { data: Workstation[], pagination }
//   POST   /member/workstations           { name, country, county, start_date }
//   PATCH  /member/workstations/{id}      partial
//   DELETE /member/workstations/{id}
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import type { ApiEnvelope, Workstation, WorkstationInput } from "@/types/nnak";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

// Demo fallback: a small in-memory list keyed by user id.
const demoStore = new Map<string, Workstation[]>();

const demoSeed = (userId: string): Workstation[] => {
  if (!demoStore.has(userId)) {
    demoStore.set(userId, [
      {
        id: "demo-ws-" + Math.random().toString(36).slice(2, 8),
        name: "Kenyatta National Hospital",
        country: "Kenya",
        county: "Nairobi",
        start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }
  return demoStore.get(userId)!;
};

export const workstationsService = {
  list: async (userId = "demo"): Promise<Workstation[]> => {
    if (isDemoSession()) return demoSeed(userId);
    try {
      return await unwrap<Workstation[]>(
        nnakApi.get("/member/workstations", { params: { per_page: 50 } }),
      );
    } catch {
      return demoSeed(userId);
    }
  },
  create: async (body: WorkstationInput, userId = "demo"): Promise<Workstation> => {
    if (isDemoSession()) {
      const items = demoSeed(userId);
      const w: Workstation = {
        id: "demo-ws-" + Math.random().toString(36).slice(2, 8),
        ...body,
        start_date: new Date(body.start_date).toISOString(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.unshift(w);
      return w;
    }
    return unwrap<Workstation>(nnakApi.post("/member/workstations", body));
  },
  update: async (
    id: string,
    body: Partial<WorkstationInput>,
    userId = "demo",
  ): Promise<Workstation> => {
    if (isDemoSession()) {
      const items = demoSeed(userId);
      const i = items.findIndex((w) => w.id === id);
      if (i < 0) throw new Error("Workstation not found");
      items[i] = {
        ...items[i],
        ...body,
        ...(body.start_date
          ? { start_date: new Date(body.start_date).toISOString() }
          : {}),
        updated_at: new Date().toISOString(),
      };
      return items[i];
    }
    return unwrap<Workstation>(nnakApi.patch(`/member/workstations/${id}`, body));
  },
  remove: async (id: string, userId = "demo"): Promise<void> => {
    if (isDemoSession()) {
      const items = demoSeed(userId);
      demoStore.set(userId, items.filter((w) => w.id !== id));
      return;
    }
    await nnakApi.delete(`/member/workstations/${id}`);
  },
};
