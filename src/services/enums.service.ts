// Consumes the read-only enum endpoints:
//   GET /api/v1/genders             -> { success, data: string[] }
//   GET /api/v1/employer-types      -> { success, data: string[] }
//   GET /api/v1/billing-frequencies -> { success, data: string[] }
//   GET /api/v1/payment-methods     -> { success, data: string[] }
//   GET /api/v1/user-roles          -> { success, data: string[] }
//   GET /api/v1/chapters            -> { success, data: Chapter[] | string[] }
//
// Each call short-circuits to a baked-in list on demo sessions so the
// fake token doesn't hit the real backend.

import { nnakApi } from "@/lib/api";
import { isDemoSession } from "@/lib/demo-token";

interface EnumResponse<T> {
  success: boolean;
  data: T[];
}

/** Normalised option shape used by every enum dropdown. */
export interface EmployerTypeOption {
  value: string;
  label: string;
}

interface EmployerTypeBackendObject {
  value?: string;
  label?: string;
  code?: string;
  name?: string;
  /** Some payloads embed it as { employer_type, employer_type_label }. */
  employer_type?: string;
  employer_type_label?: string;
}

const humanise = (s: string) =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const normaliseEmployerType = (
  raw: string | EmployerTypeBackendObject,
): EmployerTypeOption => {
  if (typeof raw === "string") return { value: raw, label: humanise(raw) };
  const value =
    raw.value ?? raw.code ?? raw.employer_type ?? raw.name ?? "";
  const label =
    raw.label ?? raw.employer_type_label ?? raw.name ?? humanise(value);
  return { value: String(value), label: String(label) };
};

const FALLBACK_GENDERS: string[] = ["male", "female"];
const FALLBACK_EMPLOYER_TYPES: EmployerTypeOption[] = [
  { value: "ministry_of_health", label: "Ministry of Health" },
  { value: "parastatal_institutions", label: "Parastatal Institutions" },
  { value: "private_institutions", label: "Private Institutions" },
  { value: "faith_based_hospitals", label: "Faith Based Hospitals" },
  { value: "counties_remittance", label: "Counties Remittance" },
  { value: "individuals", label: "Individuals" },
];
const FALLBACK_BILLING: string[] = ["monthly", "yearly"];
const FALLBACK_PAYMENT_METHODS: string[] = [
  "mpesa",
  "check_off",
  "bank_transfer",
  "card",
];
const FALLBACK_USER_ROLES: string[] = [
  "super_admin",
  "admin",
  "finance",
  "branch_manager",
  "member",
  "student",
];

export interface Chapter {
  value: string;
  label: string;
  [k: string]: unknown;
}

export const enumsService = {
  genders: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_GENDERS;
    const r = await nnakApi.get<EnumResponse<string>>("/genders");
    return r.data?.data ?? [];
  },
  /** Returns a normalised { value, label }[] regardless of whether the
   *  backend ships strings ("MOH") or option objects
   *  ({ value: "ministry_of_health", label: "Ministry of Health" }). */
  employerTypes: async (): Promise<EmployerTypeOption[]> => {
    if (isDemoSession()) return FALLBACK_EMPLOYER_TYPES;
    const r = await nnakApi.get<
      EnumResponse<string | EmployerTypeBackendObject>
    >("/employer-types");
    const raw = r.data?.data ?? [];
    return raw.map(normaliseEmployerType).filter((o) => !!o.value);
  },
  billingFrequencies: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_BILLING;
    const r = await nnakApi.get<EnumResponse<string>>("/billing-frequencies");
    return r.data?.data ?? [];
  },
  paymentMethods: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_PAYMENT_METHODS;
    const r = await nnakApi.get<EnumResponse<string>>("/payment-methods");
    return r.data?.data ?? [];
  },
  userRoles: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_USER_ROLES;
    const r = await nnakApi.get<EnumResponse<string>>("/user-roles");
    return r.data?.data ?? [];
  },
  /** Backend may return either string[] or a structured Chapter[]. */
  chapters: async (): Promise<Chapter[]> => {
    if (isDemoSession()) return [];
    const r = await nnakApi.get<EnumResponse<Chapter>>("/chapters");
    return r.data?.data ?? [];
  },
};
