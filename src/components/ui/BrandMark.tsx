const SIZES = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
} as const;

/**
 * The Katuwang mark, drawn inline so it takes the theme's primary colour (brand sea blue).
 * `variant="white"` is for dark backgrounds.
 */
export default function BrandMark({
  size = "md",
  variant = "color",
  className,
}: {
  size?: keyof typeof SIZES;
  variant?: "color" | "white";
  className?: string;
}) {
  const tone = variant === "white" ? "fill-white stroke-white" : "fill-primary stroke-primary";
  return (
    <svg
      viewBox="0 0 560 525"
      role="img"
      aria-label="Katuwang logo"
      strokeWidth={1.4}
      className={`shrink-0 ${tone} ${className ?? SIZES[size]}`}
    >
      <path d="M486.65 56.5554H277.884C277.884 158.117 193.249 242.752 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 240.802 431.701 202.18C466.884 163.558 486.65 111.175 486.65 56.5554Z" />
      <path d="M486.65 468.445H277.884C277.884 366.883 193.249 282.248 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 284.198 431.701 322.82C466.884 361.442 486.65 413.825 486.65 468.445Z" />
    </svg>
  );
}
