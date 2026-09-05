"use client";

import { useState } from "react";

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

/**
 * Reads the DaisyUI OKLCH theme tokens so charts match the rest of the app.
 * Widened from the original ReportsView copy to also expose accent / success /
 * error, which the session pre/post-test charts need.
 */
export function useThemeColors(): ThemeColors {
  const [colors] = useState<ThemeColors>(() => {
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
  });

  return colors;
}
