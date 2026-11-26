"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { DARK_THEME, LIGHT_THEME, getServerTheme, getTheme, setTheme, subscribeTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const isDark = theme === DARK_THEME;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? LIGHT_THEME : DARK_THEME)}
    >
      {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
    </button>
  );
}
