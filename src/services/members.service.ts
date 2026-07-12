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
    const r = await nnakApi.get<MembersResponse>("/admin/members", { params });
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

    // The list rows are always the fully-nested { ...user, profile } shape.
    // The URL id may be either the user id or the profile id (the members
    // list links with profile.id when present), so match on both.
    const fromList = async () => {
      const list = await nnakApi.get<MembersResponse>("/admin/members", {
        params: { per_page: 200 },
      });
      return (
        list.data?.data?.find((m) => m.id === id || m.profile?.id === id) ??
        null
      );
    };

    try {
      const r = await nnakApi.get<{
        success: boolean;
        data: (NnakUser & { profile?: NnakProfile | null }) | null;
      }>(`/admin/members/${id}`);
      const rec = r.data?.data ?? null;
      // Well-formed nested record — use it directly.
      if (rec?.profile) return rec as NnakUser & { profile: NnakProfile | null };
      // Some detail endpoints return a flat member (fields at top level) or an
      // empty record; prefer the complete nested list row when available.
      const listed = await fromList();
      if (listed) return listed;
      // Last resort: expose the flat record itself as `profile` so the detail
      // UI (which reads member.profile?.x) can still render what it has.
      if (rec) {
        return {
          ...rec,
          profile: rec as unknown as NnakProfile,
        } as NnakUser & { profile: NnakProfile | null };
      }
      return null;
    } catch {
      return await fromList();
    }
  },

  // ── Admin approval flow ────────────────────────────────────────────
  listPending: async (
    params?: { page?: number; per_page?: number },
  ): Promise<{ data: PendingMemberProfile[]; pagination?: NnakPagination }> => {
    if (isDemoSession()) {
      // Demo store doesn't carry the full PendingMemberProfile shape — the
      // approval flow is admin-only and not part of the demo personas.
      return { data: [], pagination: undefined };
    }
    const r = await nnakApi.get<PendingResponse>("/admin/members/pending", { params });
    return { data: r.data?.data ?? [], pagination: r.data?.pagination };
  },
  approve: async (profile_id: string) => {
    if (isDemoSession()) return null;
    return unwrap<unknown>(
      nnakApi.post("/admin/members/approve", { profile_id }),
    );
  },
  reject: async (profile_id: string) => {
    if (isDemoSession()) return null;
    return unwrap<unknown>(
      nnakApi.post("/admin/members/reject", { profile_id }),
    );
  },

  // ── Bulk import (Excel) ───────────────────────────────────────────
  /** GET /admin/members/import/template — download the import spreadsheet. */
  importTemplate: async (): Promise<Blob> => {
    const r = await nnakApi.get("/admin/members/import/template", {
      responseType: "blob",
    });
    return r.data as Blob;
  },
  /** POST /admin/members/import — bulk import members from an Excel file. */
  importMembers: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return unwrap<{ imported?: number; failed?: number; errors?: unknown[] }>(
      nnakApi.post("/admin/members/import", body, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  /** POST /admin/students/{user_id}/convert — upgrade a student to a member. */
  convertStudent: async (userId: string) =>
    unwrap<NnakUser & { profile: NnakProfile | null }>(
      nnakApi.post(`/admin/students/${userId}/convert`),
    ),

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
