import Image from "next/image";

const SIZES = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
} as const;

/** Shared Katuwang branding, using the supplied logo assets. */
export default function BrandMark({
  size = "md",
  variant = "color",
  className,
}: {
  size?: keyof typeof SIZES;
  variant?: "color" | "white";
  className?: string;
}) {
  return (
    <Image
      src={variant === "white" ? "/logos/bg-green-white-logo.svg" : "/logos/green-logo-no-bg.svg"}
      alt="Katuwang logo"
      width={560}
      height={525}
      className={`shrink-0 object-contain ${className ?? SIZES[size]}`}
      unoptimized
    />
  );
}
