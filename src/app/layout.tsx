import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { publicFontVariables } from "@/components/public/fonts";
import { ToastProvider } from "@/components/ui/Toast";
import { LIGHT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Katuwang",
  description: "Academic match and support portal",
};

// The landing page's "katuwang-public" palette and IBM Plex (Serif for headings and IDs, Sans for
// everything else); see docs/plans/portal-landing-theme.md. The portals can switch to
// "katuwang-dark": the inline script applies a stored choice before first paint.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme={LIGHT_THEME}
      suppressHydrationWarning
      // Public pages set smooth scrolling on <html>; this tells Next.js to switch it off
      // during route changes so navigations jump straight to the top.
      data-scroll-behavior="smooth"
      className={`${publicFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-base-200">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
