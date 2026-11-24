"use client";

import { useThemeMode } from "@/hooks/useThemeMode";
import type { ThemeMode } from "@/lib/theme";

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

const COLOR_TOKENS: Record<keyof ThemeColors, string> = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  accent: "--color-accent",
  success: "--color-success",
  error: "--color-error",
  grid: "--color-base-300",
  text: "--color-base-content",
};

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const colors = { ...FALLBACK_COLORS };
  for (const key of Object.keys(COLOR_TOKENS) as (keyof ThemeColors)[]) {
    colors[key] = styles.getPropertyValue(COLOR_TOKENS[key]).trim() || FALLBACK_COLORS[key];
  }
  return colors;
}

/** Theme tokens are static CSS, so each mode's colours are read at most once. */
const colorsByMode = new Map<ThemeMode, ThemeColors>();

function colorsFor(mode: ThemeMode): ThemeColors {
  if (typeof window === "undefined") return FALLBACK_COLORS;
  let colors = colorsByMode.get(mode);
  if (!colors) {
    colors = readThemeColors();
    colorsByMode.set(mode, colors);
  }
  return colors;
}

/**
 * Reads the DaisyUI OKLCH theme tokens so charts match the rest of the app,
 * and switches palette when the user toggles between light and dark.
 */
export function useThemeColors(): ThemeColors {
  return colorsFor(useThemeMode());
}
