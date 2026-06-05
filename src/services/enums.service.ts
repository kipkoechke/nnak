// Consumes the read-only enum endpoints:
//   GET /api/v1/genders         -> { success, data: string[] }
//   GET /api/v1/employer-types  -> { success, data: string[] }
//
// Falls back to a baked-in list when the real API isn't reachable (or
// when the user is on a demo session) so the UI never has empty selects.

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

export const enumsService = {
  genders: async (): Promise<string[]> => {
    if (isDemoSession()) return FALLBACK_GENDERS;
    try {
      const r = await nnakApi.get<EnumResponse<string>>("/genders");
      return r.data?.data ?? FALLBACK_GENDERS;
    } catch {
      return FALLBACK_GENDERS;
    }
  },
  employerTypes: async (): Promise<EmployerType[]> => {
    if (isDemoSession()) return FALLBACK_EMPLOYER_TYPES;
    try {
      const r = await nnakApi.get<EnumResponse<EmployerType>>("/employer-types");
      return r.data?.data ?? FALLBACK_EMPLOYER_TYPES;
    } catch {
      return FALLBACK_EMPLOYER_TYPES;
    }
  },
};
