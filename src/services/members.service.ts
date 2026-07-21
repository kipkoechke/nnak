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

/** Mirrors the `meta.supported_params` advertised by GET /admin/members —
 *  anything outside this set is ignored by the backend. */
export interface MemberListQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  member_category_id?: string;
  branch_id?: string;
  /** Aging bucket in months (e.g. "0", "1-3", "3+") as supported upstream. */
  aging?: string;
  /** Filter by approval state. */
  approved?: boolean;
}

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

type MemberRecord = NnakUser & { profile: NnakProfile | null };

/** A settled contribution/payment in a member's history. */
export interface MemberContribution {
  id: string;
  invoice_number: string | null;
  amount: number;
  payment_method: string | null;
  payment_reference: string | null;
  membership_type: string | null;
  paid_at: string | null;
}

/** An unpaid invoice awaiting settlement. Best-effort — the backend returns
 *  whatever fields it has for the outstanding item. */
export interface PendingInvoice {
  id: string;
  invoice_number: string | null;
  amount: number;
  due_date?: string | null;
  membership_type?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface MemberContributions {
  lifetime_paid: number;
  lifetime_pending: number;
  history: MemberContribution[];
  pagination?: NnakPagination;
}

export interface MemberDetail {
  member: MemberRecord;
  contributions: MemberContributions;
  pending_invoices: PendingInvoice[];
}

const EMPTY_CONTRIBUTIONS: MemberContributions = {
  lifetime_paid: 0,
  lifetime_pending: 0,
  history: [],
};

/**
 * The admin members API returns a *flat* member (fields at the top level:
 * nck_number, membership_type, chapter, branch_name, is_active, …), while the
 * UI reads them under `member.profile`. Normalise either shape into the nested
 * view model so the list and detail screens render without per-field guards.
 */
const normalizeMember = (raw: unknown): MemberRecord => {
  const row = (raw ?? {}) as Record<string, unknown>;
  const val = <T = string>(k: string) => row[k] as T | undefined;

  // Already nested — trust it, but ensure a profile object exists.
  if (row.profile && typeof row.profile === "object") {
    return row as unknown as MemberRecord;
  }

  const branchObj = row.branch as { id?: string; name?: string } | undefined;
  const branchName = branchObj?.name ?? (val("branch_name") as string | undefined);
  const branchId = branchObj?.id ?? (val("branch_id") as string | undefined) ?? null;
  const category = val("membership_type") ?? val("member_category");
  const approved = val<boolean>("is_approved");
  const subActive =
    val<boolean>("subscription_active") ?? val<boolean>("is_active") ?? false;
  // The API escapes slashes ("https:\/\/…"); normalise so consumers — the
  // detail page and the digital ID PDF — get a usable URL.
  const photoUrl = (val("photo_url") as string | undefined)?.replace(
    /\\/g,
    "",
  );

  const profile = {
    id: (val("profile_id") ?? val("id")) as string,
    user_id: val("id") as string,
    photo_url: photoUrl ?? null,
    account_number: (val("account_number") ?? "") as string,
    membership_number: val("membership_number") ?? null,
    nck_number: val("nck_number") ?? null,
    phone: val("phone") ?? null,
    identification_number:
      val("national_id") ?? val("identification_number") ?? null,
    identification_type: val("identification_type") ?? null,
    professional_qualification: val("professional_qualification") ?? null,
    professional_cadre: val("professional_cadre") ?? null,
    designation: val("designation") ?? null,
    date_of_birth: val("date_of_birth") ?? null,
    gender: (val("gender") ?? "") as string,
    county: val("county") ?? null,
    chapter: val("chapter_code") ?? null,
    chapter_label: val("chapter") ?? null,
    member_category: category ? { id: "", name: category as string } : null,
    member_category_id: val("member_category_id") ?? null,
    branch: branchName ? { id: branchId, name: branchName } : null,
    branch_id: branchId,
    is_approved: approved,
    approved_at: val("approved_at") ?? null,
    status: (val("status") ?? (approved ? "active" : "pending")) as string,
    subscription_active: subActive,
    subscription_expires_at:
      val("subscription_ends_on") ?? val("subscription_expires_at") ?? null,
    active_subscription: row.active_subscription ?? null,
    created_at: (val("created_at") ?? "") as string,
    updated_at: (val("updated_at") ?? "") as string,
  } as unknown as NnakProfile;

  return {
    id: val("id") as string,
    name: (val("name") ?? "") as string,
    email: (val("email") ?? "") as string,
    role: (val("role") ?? "member") as NnakUser["role"],
    email_verified_at: val("email_verified_at") ?? null,
    profile,
  } as MemberRecord;
};

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
      data: (r.data?.data ?? []).map(normalizeMember),
      pagination,
      // Backwards-compat alias so existing call-sites using `.meta` still work.
      meta: pagination,
    };
  },

  getById: async (id: string): Promise<MemberRecord | null> => {
    if (isDemoSession()) return mockStore.getMember(id) as MemberRecord | null;

    // Fallback: scan the list (flat rows) and match on user or profile id.
    const fromList = async () => {
      const list = await nnakApi.get<MembersResponse>("/admin/members", {
        params: { per_page: 200 },
      });
      const found = (list.data?.data ?? [])
        .map(normalizeMember)
        .find((m) => m.id === id || m.profile?.id === id);
      return found ?? null;
    };

    try {
      // Detail endpoint returns { data: { member, contributions, pending_invoices } }
      // where `member` is flat; older/other shapes return the member directly.
      const r = await nnakApi.get<{
        success: boolean;
        data:
          | ({ member?: unknown } & Record<string, unknown>)
          | null;
      }>(`/admin/members/${id}`);
      const data = r.data?.data ?? null;
      const rec =
        data && typeof data === "object" && "member" in data
          ? (data as { member?: unknown }).member
          : data;
      if (rec && typeof rec === "object") return normalizeMember(rec);
      return await fromList();
    } catch {
      return await fromList();
    }
  },

  /** Full admin member detail incl. contribution history and pending invoices.
   *  GET /admin/members/{id} -> { member, contributions, pending_invoices }. */
  getDetail: async (id: string): Promise<MemberDetail | null> => {
    if (isDemoSession()) {
      const m = mockStore.getMember(id) as MemberRecord | null;
      return m
        ? { member: m, contributions: EMPTY_CONTRIBUTIONS, pending_invoices: [] }
        : null;
    }
    const r = await nnakApi.get<{
      success: boolean;
      data: {
        member?: unknown;
        contributions?: Partial<MemberContributions>;
        pending_invoices?: PendingInvoice[];
      } | null;
    }>(`/admin/members/${id}`);
    const data = r.data?.data;
    if (!data?.member) return null;
    return {
      member: normalizeMember(data.member),
      contributions: {
        lifetime_paid: data.contributions?.lifetime_paid ?? 0,
        lifetime_pending: data.contributions?.lifetime_pending ?? 0,
        history: data.contributions?.history ?? [],
        pagination: data.contributions?.pagination,
      },
      pending_invoices: data.pending_invoices ?? [],
    };
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
  /** POST /admin/members/import — bulk import members from an Excel file.
   *  Requires a target branch; an optional category code applies to all rows. */
  importMembers: async (input: {
    file: File;
    branch_id: string;
    member_category_code?: string;
  }) => {
    const body = new FormData();
    body.append("file", input.file);
    body.append("branch_id", input.branch_id);
    if (input.member_category_code)
      body.append("member_category_code", input.member_category_code);
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
