import BrandMark from "@/components/ui/BrandMark";

export default function Logo({
  variant = "color",
  className = "w-8 h-8",
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  return <BrandMark variant={variant} className={className} />;
}
