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
import type { EmployerType } from "@/types/nnak";

interface EnumResponse<T> {
  success: boolean;
  data: T[];
}

const FALLBACK_GENDERS: string[] = ["male", "female"];
const FALLBACK_EMPLOYER_TYPES: EmployerType[] = [
  "MOH",
  "Parastatal",
  "Private",
  "FBO",
  "Other",
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
  id?: string;
  name: string;
  [k: string]: unknown;
}

export const enumsService = {
  genders: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_GENDERS;
    const r = await nnakApi.get<EnumResponse<string>>("/genders");
    return r.data?.data ?? [];
  },
  employerTypes: async (): Promise<EmployerType[]> => {
    if (isDemoSession()) return FALLBACK_EMPLOYER_TYPES;
    const r = await nnakApi.get<EnumResponse<EmployerType>>("/employer-types");
    return r.data?.data ?? [];
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
    const r = await nnakApi.get<EnumResponse<Chapter | string>>("/chapters");
    const data = r.data?.data ?? [];
    return data.map((c) =>
      typeof c === "string" ? ({ name: c } as Chapter) : (c as Chapter),
    );
  },
};
