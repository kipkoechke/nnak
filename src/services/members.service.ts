/**
 * Members service — real backend with demo fallback.
 *
 * Endpoints
 *   GET  /members                  paginated list (incl. profile + branch + category)
 *   GET  /members/{id}             best-effort singleton (falls back to list scan)
 *   GET  /members/pending          pending-approval profile rows
 *   POST /members/approve  { profile_id }
 *   POST /members/reject   { profile_id }
 *
 * Legacy mock-store flows (create / update / setStatus) are kept so the
 * existing admin demo screens keep working until matching real endpoints
 * land.
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type {
  ApiEnvelope,
  MemberStatus,
  NnakPagination,
  NnakProfile,
  NnakUser,
  PendingMemberProfile,
} from "@/types/nnak";

interface MembersResponse {
  success: boolean;
  data: (NnakUser & { profile: NnakProfile | null })[];
  pagination?: NnakPagination;
}
interface PendingResponse {
  success: boolean;
  data: PendingMemberProfile[];
  pagination?: NnakPagination;
}

export interface MemberListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category_id?: string;
  branch_id?: string;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

export const membersService = {
  list: async (params?: MemberListQuery) => {
    if (isDemoSession()) {
      const mock = mockStore.listMembers(params);
      // Mock store already returns { data, meta }; alias meta as pagination
      // too so call-sites can use either shape interchangeably.
      return { ...mock, pagination: mock.meta };
    }
    const r = await nnakApi.get<MembersResponse>("/members", { params });
    const pagination = r.data?.pagination;
    return {
      data: r.data?.data ?? [],
      pagination,
      // Backwards-compat alias so existing call-sites using `.meta` still work.
      meta: pagination,
    };
  },

  getById: async (id: string) => {
    if (isDemoSession()) return mockStore.getMember(id);
    try {
      const r = await nnakApi.get<{
        success: boolean;
        data: NnakUser & { profile: NnakProfile | null };
      }>(`/members/${id}`);
      return r.data?.data ?? null;
    } catch {
      const list = await nnakApi.get<MembersResponse>("/members", {
        params: { per_page: 100 },
      });
      return list.data?.data?.find((m) => m.id === id) ?? null;
    }
  },

  // ── Admin approval flow ────────────────────────────────────────────
  listPending: async (params?: { page?: number; per_page?: number }) => {
    if (isDemoSession()) {
      const all = mockStore.listMembers({ status: "pending", ...params });
      return all;
    }
    const r = await nnakApi.get<PendingResponse>("/members/pending", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },
  approve: async (profile_id: string) => {
    if (isDemoSession()) return null;
    return unwrap<unknown>(
      nnakApi.post("/members/approve", { profile_id }),
    );
  },
  reject: async (profile_id: string) => {
    if (isDemoSession()) return null;
    return unwrap<unknown>(
      nnakApi.post("/members/reject", { profile_id }),
    );
  },

  // ── Legacy demo helpers ───────────────────────────────────────────
  create: async (input: {
    name: string;
    email: string;
    role?: "member" | "student";
    profile: Partial<NnakProfile>;
  }) => mockStore.createMember(input),
  update: async (
    id: string,
    patch: { name?: string; email?: string; profile?: Partial<NnakProfile> },
  ) => mockStore.updateMember(id, patch),
  setStatus: async (id: string, status: MemberStatus, reason?: string) =>
    mockStore.setMemberStatus(id, status, reason),
  suspend: async (id: string, reason?: string) =>
    mockStore.setMemberStatus(id, "suspended", reason),
};
