/**
 * Formats numbers with appropriate suffixes (K, M, B, T)
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {boolean} removeTrailingZeros - Whether to remove trailing zeros (default: true)
 * @returns {string} Formatted number string
 */
export function formatNumber(
  num: number,
  decimals: number = 2,
  removeTrailingZeros: boolean = false,
): string {
  if (num === 0) return "0";
  if (num < 0)
    return "-" + formatNumber(Math.abs(num), decimals, removeTrailingZeros);

  const units = [
    { value: 1e12, suffix: "T" }, // Trillion
    { value: 1e9, suffix: "B" }, // Billion
    { value: 1e6, suffix: "M" }, // Million
    { value: 1e3, suffix: "K" }, // Thousand
  ];

  for (const unit of units) {
    if (num >= unit.value) {
      let formatted = (num / unit.value).toFixed(decimals);

      if (removeTrailingZeros) {
        formatted = parseFloat(formatted).toString();
      }

      return formatted + unit.suffix;
    }
  }

  // For numbers less than 1000, return as is with thousand separators
  return num.toLocaleString();
}

/**
 * Compact number formatter - removes decimal places when they're .0
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumberCompact(num: number): string {
  return formatNumber(num, 1, true);
}

/**
 * Precise number formatter - always shows specified decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 */
interface FormatNumberPreciseOptions {
  num: number;
  decimals?: number;
}

export function formatNumberPrecise(
  num: FormatNumberPreciseOptions["num"],
  decimals: FormatNumberPreciseOptions["decimals"] = 1,
): string {
  return formatNumber(num, decimals, false);
}
