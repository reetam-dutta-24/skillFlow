export const THEME_STORAGE_KEY = "skillflow-theme";

export const DEFAULT_THEME = "dark" as const;

export type ThemeMode = "dark" | "light";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function resolveTheme(value: string | null | undefined): ThemeMode {
  return isThemeMode(value) ? value : DEFAULT_THEME;
}

/** Apply a theme class and persist it for the next request. */
export function applyTheme(theme: ThemeMode, target?: HTMLElement | null) {
  const root = target ?? document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);

  if (root === document.documentElement) {
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("skillflow-theme", { detail: theme }));
  }
}

export function readTheme(): ThemeMode {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}
