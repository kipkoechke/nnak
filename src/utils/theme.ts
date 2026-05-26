export interface AppTheme {
  primary: string;
  primary_hover: string;
  secondary: string;
  accent: string;
  background: string;
  foreground?: string;
  surface?: string;
  surface_hover?: string;
  border?: string;
}

export const defaultTheme: AppTheme = {
  primary: "#80cc28",
  primary_hover: "#6db521",
  secondary: "#8f0303",
  accent: "#d8913f",
  background: "#ffffff",
  foreground: "#171717",
  surface: "#ffffff",
  surface_hover: "#f3f4f6",
  border: "#e5e7eb",
};

const THEME_KEY = "ravine_theme_v1";

const SOFT_WHITE = "#f9fafb";
const SOFT_BLACK = "#111827";

const adjustColor = (hex: string, amount: number): string => {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);

  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const lighten = (hex: string, percent: number): string => {
  return adjustColor(hex, Math.round(255 * (percent / 100)));
};

const darken = (hex: string, percent: number): string => {
  return adjustColor(hex, -Math.round(255 * (percent / 100)));
};

const getLuminance = (hex: string): number => {
  try {
    const c = hex.replace("#", "");
    if (c.length !== 6) return 0;

    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;

    const transform = (v: number) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

    return (
      0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b)
    );
  } catch {
    return 0;
  }
};

const getContrastRatio = (l1: number, l2: number): number => {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const getReadableTextColor = (bgHex: string): string => {
  const bgLum = getLuminance(bgHex);
  const whiteLum = getLuminance(SOFT_WHITE);
  const blackLum = getLuminance(SOFT_BLACK);

  const whiteContrast = getContrastRatio(bgLum, whiteLum);
  const blackContrast = getContrastRatio(bgLum, blackLum);

  if (whiteContrast > blackContrast) {
    return whiteContrast >= 4.5 ? SOFT_WHITE : SOFT_BLACK;
  }
  return blackContrast >= 4.5 ? SOFT_BLACK : SOFT_WHITE;
};

const normalizeColor = (hex: string): string => {
  const lum = getLuminance(hex);
  if (lum > 0.4 && lum < 0.6) {
    return lum > 0.5 ? darken(hex, 8) : lighten(hex, 8);
  }
  return hex;
};

const getSurface = (bgHex: string): string => {
  const lum = getLuminance(bgHex);
  if (lum < 0.5) {
    return lighten(bgHex, 18);
  }
  return darken(bgHex, 12);
};

const getBorderColor = (bgHex: string): string => {
  const lum = getLuminance(bgHex);
  if (lum < 0.5) return lighten(bgHex, 30);
  return darken(bgHex, 20);
};

const getSurfaceHover = (bgHex: string): string => {
  const lum = getLuminance(bgHex);
  if (lum < 0.5) return lighten(bgHex, 25);
  return darken(bgHex, 15);
};

const obfuscate = (data: string): string => {
  const encoded = btoa(data);
  return encoded.split("").reverse().join("");
};

const deobfuscate = (data: string): string => {
  return atob(data.split("").reverse().join(""));
};

export const saveTheme = (theme: AppTheme): void => {
  try {
    const encrypted = obfuscate(JSON.stringify(theme));
    sessionStorage.setItem(THEME_KEY, encrypted);
  } catch (error) {
    console.error("Failed to save theme:", error);
  }
};

export const loadTheme = (): AppTheme | null => {
  try {
    const stored = sessionStorage.getItem(THEME_KEY);
    if (!stored) return null;
    const decrypted = deobfuscate(stored);
    const theme = JSON.parse(decrypted) as AppTheme;

    if (
      typeof theme.primary !== "string" ||
      typeof theme.secondary !== "string" ||
      typeof theme.accent !== "string"
    ) {
      return null;
    }

    return theme;
  } catch (error) {
    console.error("Failed to load theme:", error);
    return null;
  }
};

export const clearTheme = (): void => {
  sessionStorage.removeItem(THEME_KEY);
};

export const computeTheme = (apiTheme: Partial<AppTheme>): AppTheme => {
  const primary = normalizeColor(apiTheme.primary || defaultTheme.primary);
  const primaryHover = apiTheme.primary_hover || defaultTheme.primary_hover;
  const secondary = normalizeColor(
    apiTheme.secondary || defaultTheme.secondary,
  );
  const accent = normalizeColor(apiTheme.accent || defaultTheme.accent);
  const background = apiTheme.background || defaultTheme.background;

  const surface = getSurface(background);
  const border = getBorderColor(surface);

  return {
    primary,
    primary_hover: primaryHover,
    secondary,
    accent,
    background,
    foreground: getReadableTextColor(background),
    surface,
    surface_hover: getSurfaceHover(surface),
    border,
  };
};

export const applyTheme = (theme: AppTheme): void => {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", theme.primary);
  root.style.setProperty("--color-primary-hover", theme.primary_hover);
  root.style.setProperty("--color-secondary", theme.secondary);
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--background", theme.background);
  root.style.setProperty(
    "--foreground",
    theme.foreground || getReadableTextColor(theme.background),
  );
  root.style.setProperty("--color-background", theme.background);
  root.style.setProperty(
    "--color-foreground",
    theme.foreground || getReadableTextColor(theme.background),
  );
  root.style.setProperty("--color-surface", theme.surface || theme.background);
  root.style.setProperty(
    "--color-surface-hover",
    theme.surface_hover || getSurfaceHover(theme.background),
  );
  root.style.setProperty(
    "--color-border",
    theme.border || getBorderColor(theme.surface || theme.background),
  );
  root.style.setProperty(
    "--color-on-primary",
    getReadableTextColor(theme.primary),
  );
  root.style.setProperty(
    "--color-on-secondary",
    getReadableTextColor(theme.secondary),
  );
  root.style.setProperty(
    "--color-on-accent",
    getReadableTextColor(theme.accent),
  );
};
