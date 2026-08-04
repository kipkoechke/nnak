/**
 * Helpers for the endpoints that accept an uploaded image in the same field
 * that otherwise holds a URL (`photo_url`, `logo_url`, `cover_image_url`, …),
 * the way `PATCH /profile` already takes a file under `photo_url`.
 *
 * A request only becomes multipart when a File is actually picked, so the
 * plain JSON path — and everything already relying on it — is untouched.
 */

export const isFileValue = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

/** True when any top-level value is a File and the request must go multipart. */
export const hasFileValue = (input: unknown): boolean =>
  !!input &&
  typeof input === "object" &&
  Object.values(input as Record<string, unknown>).some(isFileValue);

const appendValue = (fd: FormData, key: string, value: unknown) => {
  if (value === undefined) return;
  // FormData has no null; Laravel's ConvertEmptyStringsToNull turns "" back
  // into null, which is what the clear-this-field case needs.
  if (value === null) {
    fd.append(key, "");
    return;
  }
  if (isFileValue(value)) {
    fd.append(key, value);
    return;
  }
  if (typeof value === "boolean") {
    fd.append(key, value ? "1" : "0");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => appendValue(fd, `${key}[${i}]`, item));
    return;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
      appendValue(fd, `${key}[${k}]`, v),
    );
    return;
  }
  fd.append(key, String(value));
};

/**
 * Encodes a payload as multipart. Pass `method` for updates: PHP does not
 * parse a file upload on a real PUT/PATCH, so those go out as POST with a
 * `_method` override.
 */
export const toFormData = (
  input: object,
  opts?: { method?: "PUT" | "PATCH" },
): FormData => {
  const fd = new FormData();
  Object.entries((input ?? {}) as Record<string, unknown>).forEach(
    ([key, value]) => appendValue(fd, key, value),
  );
  if (opts?.method) fd.append("_method", opts.method);
  return fd;
};

export const MULTIPART_HEADERS = {
  headers: { "Content-Type": "multipart/form-data" },
} as const;
