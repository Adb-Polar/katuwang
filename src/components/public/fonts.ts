import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

// Public pages (landing, auth, privacy policy) use IBM Plex; the portals keep the app fonts.
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--lp-serif",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--lp-sans", display: "swap" });

/** Class names that declare the --lp-serif / --lp-sans font variables. */
export const publicFontVariables = `${plexSerif.variable} ${plexSans.variable}`;
