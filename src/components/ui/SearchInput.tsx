import { Search } from "lucide-react";

/**
 * The bordered search pill (magnifier + growing text input) used above the
 * learner browse grids. Distinct from `GlobalSearch`'s `.kt-search` topbar pill.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  transform,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  /** `"upper"` upper-cases input as it's typed (for ID searches like `TUT-0148`). */
  transform?: "upper";
  className?: string;
}) {
  return (
    <label
      className={`input input-bordered flex min-h-11 items-center gap-2 text-base sm:text-sm ${className}`.trim()}
    >
      <Search className="h-3.5 w-3.5 opacity-50" />
      <input
        type="text"
        aria-label={label ?? placeholder}
        className="grow"
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(transform === "upper" ? e.target.value.toUpperCase() : e.target.value)
        }
      />
    </label>
  );
}
