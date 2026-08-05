/**
 * Membership coverage — the grace-aware view of "is this member active".
 *
 * A subscription term ends on `subscription_ends_on`, but benefits run to
 * `coverage_end_date` (term + the category's grace period, 3 months by
 * default). Admin listings already treat anyone inside that window as active,
 * so the member's own screens have to read the same field — keying off the
 * raw subscription end shows "overdue / inactive" to someone the rest of the
 * system considers in good standing.
 */

interface CoverageSources {
  /** `/member/dashboard` and `/profile` both send these. */
  coverage_active?: boolean | null;
  current_coverage_end_date?: string | null;
  /** `profile.coverage_end_date` on member payloads. */
  coverage_end_date?: string | null;
  /** End of the paid term, before grace. */
  subscription_ends_on?: string | null;
  subscription_expires_at?: string | null;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Whole days from today until `iso`; negative once it has passed. */
export const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - startOfToday().getTime()) / 86_400_000,
  );
};

export interface CoverageState {
  /** Covered right now — the grace window counts. */
  active: boolean;
  /** Last day of coverage (term + grace). */
  endDate: string | null;
  /** End of the paid term, which may already have passed. */
  termEndDate: string | null;
  /** Days until coverage lapses; negative once it has. */
  daysLeft: number | null;
  /** The paid term has ended but coverage has not — renew before it does. */
  inGrace: boolean;
}

/**
 * Resolves coverage from whichever fields a payload carries.
 *
 * A `coverage_active: true` is taken at face value. A false (or missing) flag
 * falls back to the date, because an endpoint that has not been made
 * grace-aware yet would otherwise report "inactive" for a member the admin
 * listings show as active.
 */
export const coverageState = (
  ...sources: (CoverageSources | null | undefined)[]
): CoverageState => {
  const pick = <K extends keyof CoverageSources>(key: K) => {
    for (const s of sources) {
      const v = s?.[key];
      if (v !== undefined && v !== null) return v;
    }
    return null;
  };

  const endDate =
    (pick("current_coverage_end_date") as string | null) ??
    (pick("coverage_end_date") as string | null) ??
    (pick("subscription_ends_on") as string | null) ??
    (pick("subscription_expires_at") as string | null);
  const termEndDate =
    (pick("subscription_ends_on") as string | null) ??
    (pick("subscription_expires_at") as string | null);

  const daysLeft = daysUntil(endDate);
  const flag = pick("coverage_active") as boolean | null;
  const active = flag === true || (daysLeft !== null && daysLeft >= 0);

  const termDaysLeft = daysUntil(termEndDate);
  const inGrace =
    active && termDaysLeft !== null && termDaysLeft < 0 && !!endDate;

  return { active, endDate, termEndDate, daysLeft, inGrace };
};

/** One line describing where the member stands, for cards and headers. */
export const coverageSubtitle = (state: CoverageState): string => {
  const { active, daysLeft, inGrace } = state;
  if (daysLeft === null) return "No active subscription";
  if (!active) return `${Math.abs(daysLeft)} days overdue — renew now`;
  if (inGrace)
    return daysLeft === 0
      ? "Grace period ends today — renew now"
      : `In grace period — ${daysLeft} days left to renew`;
  return `${daysLeft} days until renewal`;
};
