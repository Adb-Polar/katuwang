import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-base-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
