/**
 * The by-product API returns `errors` as a JSON-encoded array of strings
 * (occasionally a bare string). Decode it into lines so the UI can list them
 * instead of dumping escaped JSON.
 */
export const parseByProductErrors = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((e) => String(e));
    return [String(parsed)];
  } catch {
    return [raw];
  }
};

/** Tailwind classes for an upload's processing status pill. */
export const byProductStatusClass = (status?: string) =>
  status === "completed"
    ? "bg-emerald-50 text-emerald-700"
    : status === "processing" || status === "queued"
      ? "bg-amber-50 text-amber-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
