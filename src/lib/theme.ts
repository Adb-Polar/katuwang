export const LIGHT_THEME = "katuwang-public";
export const DARK_THEME = "katuwang-dark";
export const THEME_STORAGE_KEY = "kt-theme";

export type ThemeName = typeof LIGHT_THEME | typeof DARK_THEME;

/** Runs before hydration (see app/layout.tsx) so a stored dark choice never flashes light. */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="${DARK_THEME}")document.documentElement.setAttribute("data-theme","${DARK_THEME}")}catch(e){}`;

export function getTheme(): ThemeName {
  if (typeof document === "undefined") return LIGHT_THEME;
  return document.documentElement.getAttribute("data-theme") === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

export function getServerTheme(): ThemeName {
  return LIGHT_THEME;
}

export function setTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

/** For useSyncExternalStore: fires whenever the theme attribute on <html> changes. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
