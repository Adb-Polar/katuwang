/** Light/dark theme switching. The DaisyUI theme names live in `globals.css`. */

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "kt-theme";

export const THEME_NAMES: Record<ThemeMode, string> = {
  light: "katuwang theme",
  dark: "katuwang dark",
};

/**
 * Runs in <head> before first paint so a returning dark-mode user never sees a
 * light flash. A stored choice wins; otherwise the OS preference decides.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(m!=="light"&&m!=="dark"){m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",m==="dark"?${JSON.stringify(
  THEME_NAMES.dark
)}:${JSON.stringify(THEME_NAMES.light)})}catch(e){}})();`;

export function readThemeMode(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === THEME_NAMES.dark ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", THEME_NAMES[mode]);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* private mode / storage disabled — the choice just won't persist */
  }
}

/** Notifies `onChange` whenever the active theme attribute changes. */
export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
