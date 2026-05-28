/**
 * Parses an abbreviated string (e.g., "2.4K", "1.5M") back to a raw number.
 * Returns the numeric value, or 0 if parsing fails.
 * @example
 * parseAbbreviatedNumber("2.4K")   // 2400
 * parseAbbreviatedNumber("1.5M")   // 1500000
 * parseAbbreviatedNumber("155.89") // 155.89
 * parseAbbreviatedNumber(1200)      // 1200
 */
export const parseAbbreviatedNumber = (
  value: string | number | undefined | null,
): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  const str = value.trim();
  const match = str.match(/^(-?[\d.]+)\s*([KMBT])?$/i);
  if (!match) {
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;

  const suffix = (match[2] || "").toUpperCase();
  const multipliers: Record<string, number> = {
    K: 1e3,
    M: 1e6,
    B: 1e9,
    T: 1e12,
  };
  return num * (multipliers[suffix] || 1);
};

/**
 * Formats a value as currency with KES prefix
 * Abbreviates large numbers with K, M, B, T suffixes
 * @param value - Number or abbreviated string (e.g., 97003 or "21.92K")
 * @returns Formatted currency string
 * @example
 * formatCurrency(1200) // "KES 1.20K"
 * formatCurrency(97003) // "KES 97.00K"
 * formatCurrency(1500000) // "KES 1.50M"
 * formatCurrency("21.92K") // "KES 21.92K"
 */
export const formatCurrency = (value: string | number): string => {
  // Handle pre-abbreviated values (e.g., "21.92K", "1.5M")
  if (typeof value === "string" && /[KMBT]$/i.test(value)) {
    return `KES ${value}`;
  }

  // Convert to number
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return "KES 0.00";
  }

  // Abbreviate large numbers
  const abs = Math.abs(numericValue);

  if (abs >= 1e12) {
    return `KES ${(numericValue / 1e12).toFixed(2)}T`;
  }
  if (abs >= 1e9) {
    return `KES ${(numericValue / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `KES ${(numericValue / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `KES ${(numericValue / 1e3).toFixed(2)}K`;
  }

  // For values under 1,000, show full number with 2 decimals
  return `KES ${numericValue.toFixed(2)}`;
};

/**
 * Formats a value as an abbreviated number without currency prefix
 * @param value - Number or abbreviated string (e.g., 97003 or "21.92K")
 * @returns Formatted number string without KES prefix
 * @example
 * formatNumber(1200) // "1.20K"
 * formatNumber(97003) // "97.00K"
 * formatNumber(1500000) // "1.50M"
 */
export const formatNumber = (value: string | number): string => {
  if (typeof value === "string" && /[KMBT]$/i.test(value)) {
    return value;
  }

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return "0.00";
  }

  const abs = Math.abs(numericValue);

  if (abs >= 1e12) {
    return `${(numericValue / 1e12).toFixed(2)}T`;
  }
  if (abs >= 1e9) {
    return `${(numericValue / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `${(numericValue / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `${(numericValue / 1e3).toFixed(2)}K`;
  }

  return numericValue.toFixed(2);
};
