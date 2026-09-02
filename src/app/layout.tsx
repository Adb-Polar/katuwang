import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";

// Apfel Grotezk (Collletttivo / Alexander Meyer) — SIL OFL 1.1. Display + body face.
const apfel = localFont({
  variable: "--font-apfel",
  display: "swap",
  src: [
    { path: "./fonts/ApfelGrotezk-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ApfelGrotezk-Mittel.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ApfelGrotezk-Fett.woff2", weight: "700", style: "normal" },
    { path: "./fonts/ApfelGrotezk-Satt.woff2", weight: "900", style: "normal" },
  ],
});

// Fragment Mono (Wei Huang) — SIL OFL 1.1. Notation: IDs, dates, counts, status codes.
const fragmentMono = localFont({
  variable: "--font-fragment-mono",
  display: "swap",
  src: [
    { path: "./fonts/FragmentMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/FragmentMono-Italic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Katuwang",
  description: "Academic match and support portal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="katuwang theme"
      className={`${apfel.variable} ${fragmentMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-base-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
