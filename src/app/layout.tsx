import type { Metadata } from "next";
import { Elms_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";

const elmsSans = Elms_Sans({
  variable: "--font-elms-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Katuwang",
  description: "Academic match and support portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="katuwang theme"
      className={`${elmsSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
