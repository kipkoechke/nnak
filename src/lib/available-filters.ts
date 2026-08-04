/**
 * Listing endpoints advertise what they accept in `meta`:
 *
 *   meta: {
 *     supported_params: ["page", "per_page", "status", "aging", …],
 *     available_filters: { status: ["active", "inactive", "all"], … },
 *     applied_filters: { per_page: "15" },
 *   }
 *
 * Driving the filter dropdowns off that keeps the UI in step with the backend
 * instead of hardcoding buckets that quietly stop matching.
 */

export interface ListingMeta {
  supported_params?: string[];
  available_filters?: Record<string, string[] | undefined>;
  applied_filters?: Record<string, unknown>;
}

export interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

/** "partially_paid" → "Partially paid"; "12+" → "12+". */
export const humanizeFilter = (value: string): string => {
  const spaced = value.replace(/[_-]/g, " ").trim();
  if (!spaced) return value;
  if (/^\d/.test(spaced)) return `${spaced} months`.replace(/\bmonths months\b/, "months");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Builds select options from the API's list, falling back to the screen's own
 * options when the endpoint has not advertised any (older deploys).
 *
 * An "all" entry from the API is treated as the empty/no-filter choice so it
 * does not appear twice.
 */
export const filterOptions = (
  values: string[] | undefined,
  fallback: FilterOption[],
  allLabel = "All",
  labelOf: (value: string) => string = humanizeFilter,
): FilterOption[] => {
  if (!values?.length) return fallback;
  return [
    { value: "", label: allLabel },
    ...values
      .filter((v) => v && v.toLowerCase() !== "all")
      .map((v) => ({ value: v, label: labelOf(v) })),
  ];
};
