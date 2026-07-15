/**
 * Member categories service — real backend with demo fallback.
 *
 * Endpoints
 *   GET    /admin/member-categories            list
 *   POST   /admin/member-categories            create
 *   GET    /admin/member-categories/{category} show
 *   PUT    /admin/member-categories/{category} update
 *   DELETE /admin/member-categories/{category} delete
 *
 * Demo sessions fall back to the local mock store so the seeded personas
 * keep working without hitting the real backend.
 */
import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";
import { mockStore } from "@/lib/mock-store";
import type {
  ApiEnvelope,
  BillingFrequency,
  MemberCategory,
  NnakMembershipCategory,
  NnakPagination,
} from "@/types/nnak";

const BASE = "/admin/member-categories";

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) =>
  p.then((r) => r.data.data);

/**
 * The backend models a category as `{ subscription_fee, billing_frequency:
 * "yearly" | "monthly" }`, while the UI splits the fee into annual/monthly
 * buckets. Normalise both directions so the pages read a stable shape and the
 * cards never crash on a missing `annual_fee`.
 */
type RawCategory = {
  id: string;
  code: string;
  name: string;
  description?: string;
  subscription_fee?: number | string;
  annual_fee?: number | null;
  monthly_fee?: number | null;
  billing_frequency?: string;
  created_at: string;
  updated_at: string;
};

const normalizeCategory = (raw: RawCategory): MemberCategory => {
  const freq: BillingFrequency =
    raw.billing_frequency === "monthly" ? "monthly" : "annual";
  const fee = Number(raw.subscription_fee ?? raw.annual_fee ?? raw.monthly_fee ?? 0);
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code as NnakMembershipCategory,
    billing_frequency: freq,
    annual_fee: freq === "annual" ? fee : Number(raw.annual_fee ?? 0),
    monthly_fee: freq === "monthly" ? fee : (raw.monthly_fee ?? null),
    description: raw.description,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

const toApiPayload = (body: Partial<MemberCategory>) => {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = body.name;
  if (body.code !== undefined) out.code = body.code;
  if (body.description !== undefined) out.description = body.description;
  if (body.billing_frequency !== undefined) {
    out.billing_frequency =
      body.billing_frequency === "annual" ? "yearly" : "monthly";
  }
  // The API keeps a single subscription_fee; pick the bucket that matches the
  // chosen frequency (falling back to whichever value is present).
  const fee =
    body.billing_frequency === "monthly"
      ? body.monthly_fee
      : body.billing_frequency === "annual"
        ? body.annual_fee
        : (body.annual_fee ?? body.monthly_fee);
  if (fee != null) out.subscription_fee = fee;
  return out;
};

interface CategoriesResponse {
  success: boolean;
  data: RawCategory[];
  pagination?: NnakPagination;
}

export type CreateCategoryInput = Omit<
  MemberCategory,
  "id" | "created_at" | "updated_at"
>;

export const categoriesService = {
  list: async (): Promise<MemberCategory[]> => {
    if (isDemoSession()) return mockStore.listCategories();
    const r = await nnakApi.get<CategoriesResponse>(BASE);
    return (r.data?.data ?? []).map(normalizeCategory);
  },

  get: async (id: string): Promise<MemberCategory | null> => {
    if (isDemoSession()) {
      return mockStore.listCategories().find((c) => c.id === id) ?? null;
    }
    const raw = await unwrap<RawCategory>(nnakApi.get(`${BASE}/${id}`));
    return raw ? normalizeCategory(raw) : null;
  },

  create: async (body: CreateCategoryInput): Promise<MemberCategory> => {
    if (isDemoSession()) return mockStore.createCategory(body);
    const raw = await unwrap<RawCategory>(
      nnakApi.post(BASE, toApiPayload(body)),
    );
    return normalizeCategory(raw);
  },

  update: async (
    id: string,
    body: Partial<MemberCategory>,
  ): Promise<MemberCategory> => {
    if (isDemoSession()) return mockStore.updateCategory(id, body);
    const raw = await unwrap<RawCategory>(
      nnakApi.put(`${BASE}/${id}`, toApiPayload(body)),
    );
    return normalizeCategory(raw);
  },

  remove: async (id: string): Promise<void> => {
    if (isDemoSession()) {
      mockStore.deleteCategory(id);
      return;
    }
    await nnakApi.delete(`${BASE}/${id}`);
  },
};
