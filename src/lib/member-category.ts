/**
 * Member category codes → display labels.
 *
 * The API now returns `membership_type` as the category *code* (`individual`,
 * `checkoff`, …) rather than the display name, so every screen that used to
 * print it verbatim needs this map. Unknown codes are title-cased rather than
 * dropped, and a value that is already a display name passes through.
 */
const CATEGORY_LABELS: Record<string, string> = {
  individual: "Individual",
  checkoff: "Corporate",
  student: "Student",
  lifetime: "Lifetime",
  honorary: "Honorary",
  moh: "MOH",
  county: "County",
  parastatal: "Parastatal",
  private: "Private",
  fbo: "FBO",
};

export const categoryLabel = (value?: string | null): string => {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const known = CATEGORY_LABELS[raw.toLowerCase()];
  if (known) return known;
  // Already a display name ("Corporate") or an unseen code ("new_tier").
  return raw.includes("_")
    ? raw
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : raw.charAt(0).toUpperCase() + raw.slice(1);
};
