/**
 * Standardized API error response structure used across the app.
 * Example:
 * {
 *   success: false,
 *   message: "Stock validation failed",
 *   errors: [
 *     "Insufficient active stock for product X. Available: 26, Requested: 60.",
 *     "Insufficient quantity in batch 102 for product X. Available: 13, Requested: 30."
 *   ],
 *   code: 422
 * }
 */
export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: string[] | Record<string, string[]>;
  code?: number;
  error?: string;
  [key: string]: unknown;
}

export interface ParsedApiError {
  success: boolean;
  message: string;
  errors: string[];
  code: number | undefined;
  isValidationError: boolean;
}

/**
 * Parses an API error response into a structured format.
 * Handles multiple API error formats:
 * - { success: false, message: "...", errors: ["..."], code: 422 }
 * - { error: "...", message: "..." }
 * - { message: "...", errors: { "field": ["..."] } }
 * - { message: "..." }
 * - Standard Error objects
 */
export function parseApiError(error: unknown): ParsedApiError {
  const defaultError: ParsedApiError = {
    success: false,
    message: "Something went wrong",
    errors: [],
    code: undefined,
    isValidationError: false,
  };

  const axiosError = error as {
    response?: {
      data?: ApiErrorResponse;
    };
    message?: string;
    code?: number;
  };

  const data = axiosError?.response?.data;

  if (!data) {
    return {
      ...defaultError,
      message: axiosError?.message || defaultError.message,
    };
  }

  // Handle standardized format: { success, message, errors: string[], code }
  if (typeof data.success === "boolean" && !data.success) {
    const errors = Array.isArray(data.errors)
      ? data.errors
      : typeof data.errors === "object" && data.errors !== null
        ? Object.values(data.errors).flatMap((e) =>
            Array.isArray(e) ? e : [e]
          )
        : [];

    return {
      success: false,
      message: data.message || "An error occurred",
      errors: errors.filter((e): e is string => typeof e === "string"),
      code: data.code,
      isValidationError: data.code === 422,
    };
  }

  // Handle { error: "...", message: "..." } format
  if (data.error && typeof data.error === "string") {
    return {
      ...defaultError,
      message: data.error,
      errors: [data.error],
    };
  }

  // Handle { message: "...", errors: { "field": ["..."] } } format
  if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    const validationErrors = Object.entries(data.errors).flatMap(
      ([, messages]) => messages
    ) as string[];

    return {
      success: false,
      message: data.message || "Validation failed",
      errors: validationErrors,
      code: axiosError?.code,
      isValidationError: true,
    };
  }

  // Handle { message: "..." } format
  if (data.message && typeof data.message === "string") {
    return {
      ...defaultError,
      message: data.message,
      errors: [data.message],
    };
  }

  return {
    ...defaultError,
    message: axiosError?.message || defaultError.message,
  };
}

/**
 * Extracts a user-friendly error message from an API error response.
 *
 * Handles multiple API error formats:
 * - { success: false, message: "...", errors: ["..."], code: 422 }
 * - { error: "...", message: "..." }
 * - { message: "...", errors: { "field": ["..."] } }
 * - { message: "..." }
 * - Standard Error objects
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string = "Something went wrong",
): string {
  const parsed = parseApiError(error);
  
  // If there are errors in the errors array, return them joined with bullet points
  if (parsed.errors.length > 0) {
    return parsed.errors.map((e, i) => `${i + 1}. ${e}`).join("\n");
  }
  
  return parsed.message || fallback;
}

/**
 * Returns all error messages from an API error response.
 * Useful for displaying multiple validation errors.
 */
export function getAllErrorMessages(error: unknown): string[] {
  const parsed = parseApiError(error);
  return parsed.errors.length > 0
    ? parsed.errors
    : [parsed.message];
}

/**
 * Checks if the error is a validation error (HTTP 422).
 */
export function isValidationError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.isValidationError;
}

/**
 * Gets the error code from an API error response.
 */
export function getErrorCode(error: unknown): number | undefined {
  const parsed = parseApiError(error);
  return parsed.code;
}
