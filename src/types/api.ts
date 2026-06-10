// Minimal shared API primitives. NNAK-specific shapes live in @/types/nnak.

export type ApiError =
  | { statusCode: number; path: string; message: string | string[] }
  | {
      status: "error" | "fail";
      message: string;
      timestamp?: string;
      path?: string;
      stack?: string;
    }
  | { message: string }
  | { errors: Record<string, string[]> }
  | { success: false; message: string; errors: string[]; code: number };
