// Branding constants. Overridable per-environment via env vars so
// future white-label or staging builds don't need code changes.

export const logoSrc = process.env.NEXT_PUBLIC_LOGO_URL?.trim()
  ? process.env.NEXT_PUBLIC_LOGO_URL
  : "/assets/nnak_logo.png";

export const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim()
  ? process.env.NEXT_PUBLIC_APP_NAME
  : "NNAK Digital Platform";

export const orgName = "National Nurses Association of Kenya";
export const orgShortName = "NNAK";
