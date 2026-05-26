export const logoSrc = process.env.NEXT_PUBLIC_LOGO_URL?.trim()
  ? process.env.NEXT_PUBLIC_LOGO_URL
  : "/assets/ehl_logo.svg";

export const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim()
  ? process.env.NEXT_PUBLIC_APP_NAME
  : "NNAK Admin";
