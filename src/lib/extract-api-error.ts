import type { AxiosError } from "axios";
import type { ApiError } from "@/types/api";

export function extractApiError(
  e: unknown,
  fallback = "Unexpected error",
): string {
  const data = (e as AxiosError<ApiError>)?.response?.data;
  if (!data) return (e as Error)?.message || "Network error";

  if ("errors" in data && data.errors != null) {
    if (Array.isArray(data.errors)) {
      return data.errors.join("\n");
    }
    if (typeof data.errors === "object") {
      return Object.values(data.errors as Record<string, string[]>)
        .flat()
        .join("\n");
    }
  }

  if ("message" in data && data.message != null) {
    return Array.isArray(data.message) ? data.message.join(", ") : data.message;
  }

  return fallback;
}
