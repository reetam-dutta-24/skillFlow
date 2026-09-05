"use client";

import React, { createContext, useContext, useState } from "react";

type Theme = "dark" | "light";
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Shared so the Topbar's ThemeToggle and the Settings page's ThemeToggle
// (both write document.documentElement's class directly) agree on which
// option is highlighted, instead of drifting out of sync.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
