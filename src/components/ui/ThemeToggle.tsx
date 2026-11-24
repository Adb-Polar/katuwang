"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";
import { applyThemeMode } from "@/lib/theme";

export default function ThemeToggle({ className = "kt-icon-btn" }: { className?: string }) {
  const mode = useThemeMode();
  const nextMode = mode === "dark" ? "light" : "dark";
  const label = `Switch to ${nextMode} mode`;

  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={() => applyThemeMode(nextMode)}>
      {mode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
