import { BookOpen } from "lucide-react";

const SIZES = {
  sm: { box: "p-1 rounded", icon: "w-3.5 h-3.5" },
  md: { box: "p-2 rounded-lg", icon: "w-5 h-5" },
} as const;

export default function BrandMark({ size = "md" }: { size?: keyof typeof SIZES }) {
  const { box, icon } = SIZES[size];
  return (
    <div className={`${box} bg-primary/10 text-primary border border-primary/20`}>
      <BookOpen className={icon} strokeWidth={2.5} />
    </div>
  );
}
