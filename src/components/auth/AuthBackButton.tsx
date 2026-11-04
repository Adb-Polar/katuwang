"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AuthBackButton() {
  const router = useRouter();

  const goBack = () => {
    try {
      const previous = new URL(document.referrer);
      if (previous.origin === window.location.origin && previous.pathname !== window.location.pathname) {
        router.back();
        return;
      }
    } catch {
      // A direct visit has no usable previous page.
    }
    router.push("/");
  };

  return (
    <button type="button" onClick={goBack} className="btn btn-ghost btn-sm mb-3 gap-1.5 text-xs">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}
