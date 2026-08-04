/**
 * Normalise the `errors` payload into lines.
 *
 * The list endpoint returns a JSON-encoded string, while the detail endpoint
 * returns a real array — handle both so the UI never dumps escaped JSON.
 */
export const parseByProductErrors = (
  raw?: string | string[] | null,
): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((e) => String(e));
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
