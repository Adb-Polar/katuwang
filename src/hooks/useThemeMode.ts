import { useSyncExternalStore } from "react";
import { readThemeMode, subscribeToTheme, type ThemeMode } from "@/lib/theme";

const getServerThemeMode = (): ThemeMode => "light";

/** The active theme, kept in sync with the `<html data-theme>` attribute. */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeToTheme, readThemeMode, getServerThemeMode);
}
