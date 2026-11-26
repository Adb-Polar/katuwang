"use client";

import { useSyncExternalStore } from "react";
import { getTheme, subscribeTheme, type ThemeName } from "@/lib/theme";

const FALLBACK_COLORS = {
  primary: "#2f6f68",
  secondary: "#6b4bb3",
  accent: "#b5651d",
  success: "#2f855a",
  error: "#c53030",
  grid: "#e5e5e5",
  text: "#3a3a3a",
};

export type ThemeColors = typeof FALLBACK_COLORS;

function readThemeColors(): ThemeColors {
  if (typeof window === "undefined") return FALLBACK_COLORS;
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback;
  return {
    primary: get("--color-primary", FALLBACK_COLORS.primary),
    secondary: get("--color-secondary", FALLBACK_COLORS.secondary),
    accent: get("--color-accent", FALLBACK_COLORS.accent),
    success: get("--color-success", FALLBACK_COLORS.success),
    error: get("--color-error", FALLBACK_COLORS.error),
    grid: get("--color-base-300", FALLBACK_COLORS.grid),
    text: get("--color-base-content", FALLBACK_COLORS.text),
  };
}

let cached: { theme: ThemeName; colors: ThemeColors } | null = null;

/** useSyncExternalStore needs a stable snapshot, so the colours are cached per theme. */
function getColorSnapshot(): ThemeColors {
  const theme = getTheme();
  if (!cached || cached.theme !== theme) cached = { theme, colors: readThemeColors() };
  return cached.colors;
}

function getServerColorSnapshot(): ThemeColors {
  return FALLBACK_COLORS;
}

/**
 * Reads the DaisyUI OKLCH theme tokens so charts match the rest of the app,
 * and re-reads them when the light/dark theme is switched.
 */
export function useThemeColors(): ThemeColors {
  return useSyncExternalStore(subscribeTheme, getColorSnapshot, getServerColorSnapshot);
}
