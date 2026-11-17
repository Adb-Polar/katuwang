import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { publicFontVariables } from "@/components/public/fonts";

export const metadata: Metadata = {
  title: "Katuwang",
  description: "Academic match and support portal",
};

// One theme for the whole app: the landing page's "katuwang-public" palette and IBM Plex
// (Serif for headings and IDs, Sans for everything else). See docs/plans/portal-landing-theme.md.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="katuwang-public"
      // Public pages set smooth scrolling on <html>; this tells Next.js to switch it off
      // during route changes so navigations jump straight to the top.
      data-scroll-behavior="smooth"
      className={`${publicFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-base-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
