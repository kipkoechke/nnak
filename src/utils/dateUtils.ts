/**
 * Date Utilities
 * Comprehensive date formatting and parsing utilities with timezone support
 */

import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";

// Default timezone (East Africa Time - Kenya)
export const DEFAULT_TIMEZONE = "Africa/Nairobi";

/**
 * Parse a date value that could be in various formats
 * Handles: ISO strings, timestamps, Date objects, timezone-aware strings
 */
export const parseDate = (
  dateValue: string | number | Date | null | undefined
): Date | null => {
  if (!dateValue) return null;

  try {
    // Already a Date object
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : null;
    }

    // Numeric timestamp (milliseconds)
    if (typeof dateValue === "number") {
      const date = new Date(dateValue);
      return isValid(date) ? date : null;
    }

    // String value
    if (typeof dateValue === "string") {
      const trimmed = dateValue.trim();

      // Empty string
      if (!trimmed) return null;

      // Try parsing as ISO string first (most common from APIs)
      // Handles: "2024-12-16T10:30:00Z", "2024-12-16T10:30:00+03:00", "2024-12-16T10:30:00.000Z"
      try {
        const isoDate = parseISO(trimmed);
        if (isValid(isoDate)) return isoDate;
      } catch {
        // Continue to other parsing methods
      }

      // Try standard Date parsing (handles various formats)
      const standardDate = new Date(trimmed);
      if (isValid(standardDate)) return standardDate;

      // Handle date-only strings like "2024-12-16"
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        if (isValid(date)) return date;
      }

      // Handle datetime without timezone like "2024-12-16 10:30:00"
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        const date = new Date(trimmed.replace(" ", "T"));
        if (isValid(date)) return date;
      }

      // Handle time-only strings like "10:30:00" or "10:30"
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        const today = new Date();
        const [hours, minutes, seconds = 0] = trimmed.split(":").map(Number);
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hours,
          minutes,
          seconds
        );
        if (isValid(date)) return date;
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Safely format a date with fallback for invalid dates
 * @param dateValue - The date value to format
 * @param formatStr - The date-fns format string
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string or fallback
 */
export const safeFormatDate = (
  dateValue: string | number | Date | null | undefined,
  formatStr: string,
  fallback: string = "--"
): string => {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
};

/**
 * Format a date in a specific timezone using Intl API
 * @param dateValue - The date value to format
 * @param formatStr - The date-fns format string (used for non-timezone formatting)
 * @param timezone - The timezone to use (defaults to Africa/Nairobi)
 * @param fallback - Fallback string if date is invalid
 */
export const formatInTimezone = (
  dateValue: string | number | Date | null | undefined,
  formatStr: string,
  timezone: string = DEFAULT_TIMEZONE,
  fallback: string = "--"
): string => {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  try {
    // Use Intl.DateTimeFormat for timezone-aware formatting
    // For complex format strings, we'll use a simplified approach
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    // Parse common format patterns and map to Intl options
    if (formatStr.includes("yyyy") || formatStr.includes("yy")) {
      options.year = formatStr.includes("yyyy") ? "numeric" : "2-digit";
    }
    if (formatStr.includes("MMMM")) {
      options.month = "long";
    } else if (formatStr.includes("MMM")) {
      options.month = "short";
    } else if (formatStr.includes("MM")) {
      options.month = "2-digit";
    }
    if (formatStr.includes("dd")) {
      options.day = "2-digit";
    } else if (formatStr.includes("d")) {
      options.day = "numeric";
    }
    if (formatStr.includes("HH") || formatStr.includes("hh")) {
      options.hour = "2-digit";
      options.hour12 = formatStr.includes("hh");
    }
    if (formatStr.includes("mm")) {
      options.minute = "2-digit";
    }
    if (formatStr.includes("ss")) {
      options.second = "2-digit";
    }
    if (formatStr.includes("EEEE")) {
      options.weekday = "long";
    } else if (formatStr.includes("EEE")) {
      options.weekday = "short";
    }

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    // Fallback to regular format if timezone formatting fails
    try {
      return format(date, formatStr);
    } catch {
      return fallback;
    }
  }
};

/**
 * Get timezone offset string for a date (e.g., "+03:00")
 * @param dateValue - The date value
 * @param timezone - The timezone
 */
export const getTimezoneOffset = (
  dateValue: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string | null => {
  const date = parseDate(dateValue);
  if (!date) return null;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || null;
  } catch {
    return null;
  }
};

/**
 * Format date for display in a specific timezone (using Intl for accuracy)
 * @param dateValue - The date value
 * @param timezone - The timezone
 * @param style - The style of formatting
 */
export const formatDateTimeInTimezone = (
  dateValue: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
  style: "short" | "medium" | "long" = "medium",
  fallback: string = "--"
): string => {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  try {
    const dateStyle =
      style === "short" ? "short" : style === "long" ? "long" : "medium";
    const timeStyle = style === "short" ? "short" : "medium";

    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle,
      timeStyle,
    }).format(date);
  } catch {
    return fallback;
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param dateValue - The date value
 * @param fallback - Fallback string if date is invalid
 */
export const getRelativeTime = (
  dateValue: string | number | Date | null | undefined,
  fallback: string = "--"
): string => {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return fallback;
  }
};

/**
 * Check if a date is valid
 * @param dateValue - The date value to check
 */
export const isValidDate = (
  dateValue: string | number | Date | null | undefined
): boolean => {
  return parseDate(dateValue) !== null;
};

/**
 * Common format patterns
 */
export const DATE_FORMATS = {
  // Date only
  DATE_SHORT: "MMM dd, yyyy", // Dec 16, 2024
  DATE_LONG: "MMMM dd, yyyy", // December 16, 2024
  DATE_NUMERIC: "yyyy-MM-dd", // 2024-12-16
  DATE_SLASH: "dd/MM/yyyy", // 16/12/2024

  // Time only
  TIME_12H: "hh:mm a", // 10:30 AM
  TIME_24H: "HH:mm", // 10:30
  TIME_WITH_SECONDS: "HH:mm:ss", // 10:30:45

  // Date and time
  DATETIME_SHORT: "MMM dd, yyyy hh:mm a", // Dec 16, 2024 10:30 AM
  DATETIME_LONG: "MMMM dd, yyyy 'at' hh:mm a", // December 16, 2024 at 10:30 AM
  DATETIME_ISO: "yyyy-MM-dd'T'HH:mm:ss", // 2024-12-16T10:30:00

  // Relative formats
  DAY_MONTH: "dd MMM", // 16 Dec
  MONTH_YEAR: "MMMM yyyy", // December 2024
  WEEKDAY: "EEEE", // Monday
  WEEKDAY_SHORT: "EEE", // Mon
} as const;

/**
 * Format date with predefined format
 * @param dateValue - The date value to format
 * @param formatKey - Key from DATE_FORMATS
 * @param fallback - Fallback string if date is invalid
 */
export const formatDatePreset = (
  dateValue: string | number | Date | null | undefined,
  formatKey: keyof typeof DATE_FORMATS,
  fallback: string = "--"
): string => {
  return safeFormatDate(dateValue, DATE_FORMATS[formatKey], fallback);
};

/**
 * Get the start of day for a date
 */
export const getStartOfDay = (
  dateValue: string | number | Date | null | undefined
): Date | null => {
  const date = parseDate(dateValue);
  if (!date) return null;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Get the end of day for a date
 */
export const getEndOfDay = (
  dateValue: string | number | Date | null | undefined
): Date | null => {
  const date = parseDate(dateValue);
  if (!date) return null;

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (
  date1: string | number | Date | null | undefined,
  date2: string | number | Date | null | undefined
): boolean => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) return false;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Check if a date is today
 */
export const isToday = (
  dateValue: string | number | Date | null | undefined
): boolean => {
  return isSameDay(dateValue, new Date());
};
