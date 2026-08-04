/**
 * Member categories service — real backend with demo fallback.
 *
 * Endpoints
 *   GET    /admin/member-categories            list
 *   POST   /admin/member-categories            create
 *   GET    /admin/member-categories/{category} show
 *   PATCH  /admin/member-categories/{category} update
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
  grace_period_months?: number | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

/** The API says `yearly`; every screen here says `annual`. Lifetime and
 *  honorary tiers bill `one_time`. */
const TO_UI_FREQUENCY: Record<string, BillingFrequency> = {
  monthly: "monthly",
  yearly: "annual",
  annual: "annual",
  one_time: "one_time",
  one_off: "one_time",
  lifetime: "one_time",
};

const TO_API_FREQUENCY: Record<BillingFrequency, string> = {
  monthly: "monthly",
  annual: "yearly",
  one_time: "one_time",
};

const normalizeCategory = (raw: RawCategory): MemberCategory => {
  const freq = TO_UI_FREQUENCY[raw.billing_frequency ?? ""] ?? "annual";
  const fee = Number(
    raw.subscription_fee ?? raw.annual_fee ?? raw.monthly_fee ?? 0,
  );
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code as NnakMembershipCategory,
    billing_frequency: freq,
    subscription_fee: fee,
    // A one-off fee is charged in full, so it lands in the annual bucket the
    // older subscription screens read.
    annual_fee: freq === "monthly" ? Number(raw.annual_fee ?? 0) : fee,
    monthly_fee: freq === "monthly" ? fee : (raw.monthly_fee ?? null),
    grace_period_months: raw.grace_period_months ?? undefined,
    is_active: raw.is_active ?? true,
    description: raw.description,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

/** The API keeps a single subscription_fee; prefer it, else pick the bucket
 *  matching the chosen frequency. */
const feeOf = (body: Partial<MemberCategory>) =>
  body.subscription_fee ??
  (body.billing_frequency === "monthly"
    ? body.monthly_fee
    : body.billing_frequency === "annual" ||
        body.billing_frequency === "one_time"
      ? body.annual_fee
      : (body.annual_fee ?? body.monthly_fee));

const toApiPayload = (body: Partial<MemberCategory>) => {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = body.name;
  if (body.code !== undefined) out.code = body.code;
  if (body.description !== undefined) out.description = body.description;
  if (body.billing_frequency !== undefined) {
    out.billing_frequency = TO_API_FREQUENCY[body.billing_frequency];
  }
  if (body.grace_period_months !== undefined) {
    out.grace_period_months = body.grace_period_months;
  }
  if (body.is_active !== undefined) out.is_active = body.is_active;
  const fee = feeOf(body);
  if (fee != null) out.subscription_fee = fee;
  return out;
};

/**
 * PATCH only accepts `name`, `subscription_fee` and `billing_frequency` — the
 * code is fixed once a category exists, and anything else is rejected, so the
 * update payload is built separately rather than filtered after the fact.
 */
const toUpdatePayload = (body: Partial<MemberCategory>) => {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = body.name;
  if (body.billing_frequency !== undefined) {
    out.billing_frequency = TO_API_FREQUENCY[body.billing_frequency];
  }
  const fee = feeOf(body);
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
    // The route paginates at 15; the register is small, so take it in one go.
    const r = await nnakApi.get<CategoriesResponse>(BASE, {
      params: { per_page: 100 },
    });
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
      nnakApi.patch(`${BASE}/${id}`, toUpdatePayload(body)),
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
