"use client";

import type { ReactNode } from "react";
import AuthProvider from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
