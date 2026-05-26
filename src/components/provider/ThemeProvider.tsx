"use client";

import { useEffect, useState } from "react";
import { loadTheme, applyTheme, defaultTheme, type AppTheme } from "@/utils/theme";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const savedTheme = loadTheme();
    const themeToApply = savedTheme || defaultTheme;
    applyTheme(themeToApply);
    setIsApplied(true);
  }, []);

  if (!isApplied) {
    return null;
  }

  return <>{children}</>;
}

export default ThemeProvider;
