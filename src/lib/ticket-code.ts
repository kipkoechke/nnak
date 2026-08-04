/**
 * Pulls a ticket number out of whatever a badge QR happens to carry.
 *
 * Tickets are emailed as codes like `TKT-CONF2026-ABC123`, but the same badge
 * may be printed as a check-in URL or as a small JSON blob depending on where
 * it was generated, so the door scanner accepts all three rather than failing
 * on a valid badge.
 */
export const extractTicketNumber = (raw: string): string => {
  const text = (raw ?? "").trim();
  if (!text) return "";

  // JSON payload, e.g. {"ticket_number":"TKT-…"}
  if (text.startsWith("{")) {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>;
      const value = obj.ticket_number ?? obj.ticket ?? obj.code;
      if (typeof value === "string" && value.trim()) return value.trim();
    } catch {
      // Fall through to the plain-text handling below.
    }
  }

  // URL payload, e.g. https://nnak.or.ke/checkin?ticket=TKT-…
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const param =
        url.searchParams.get("ticket_number") ??
        url.searchParams.get("ticket") ??
        url.searchParams.get("code");
      if (param?.trim()) return param.trim();
      const lastSegment = url.pathname.split("/").filter(Boolean).pop();
      if (lastSegment) return decodeURIComponent(lastSegment);
    } catch {
      // Not a parseable URL after all.
    }
  }

  // Plain code — take the ticket token if the QR wraps it in other text.
  const token = /TKT-[A-Z0-9-]+/i.exec(text);
  return (token?.[0] ?? text).trim();
};
