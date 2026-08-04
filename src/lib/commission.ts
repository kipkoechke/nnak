/**
 * Commission values arrive as decimal strings ("3.00", "20.00") whose meaning
 * depends on `commission_type`: a percentage type means 3%, a fixed-value type
 * means KES 20. Rendering the raw string loses that distinction, so every
 * screen formats through here.
 */

export const isPercentageCommission = (type?: string | null) =>
  (type ?? "").includes("percentage");

/** Trims the trailing zeros the API pads decimals with: "3.00" → "3". */
const trimDecimals = (value: number) =>
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));

export const fmtCommissionValue = (
  value?: string | number | null,
  type?: string | null,
) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return isPercentageCommission(type)
    ? `${trimDecimals(n)}%`
    : `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

/** "Individual Percentage · 3%" — the label plus its formatted value. */
export const fmtCommission = (
  label?: string | null,
  value?: string | number | null,
  type?: string | null,
) => {
  const readable =
    label || (type ? type.replace(/_/g, " ") : "") || "Commission";
  return `${readable} · ${fmtCommissionValue(value, type)}`;
};

/** KES amounts also arrive as decimal strings ("435600.00"). */
export const fmtKes = (value?: string | number | null) => {
  const n = Number(value ?? 0);
  return `KES ${(Number.isNaN(n) ? 0 : n).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
};
