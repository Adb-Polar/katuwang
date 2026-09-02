const SIZES = {
  sm: "w-6 h-6 text-[0.7rem] rounded-md",
  md: "w-8 h-8 text-sm rounded-lg",
} as const;

export default function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  return (
    <div
      className={`grid place-items-center bg-primary text-primary-content font-sans font-bold shrink-0 ${SIZES[size]}`}
      aria-hidden="true"
    >
      K
    </div>
  );
}
