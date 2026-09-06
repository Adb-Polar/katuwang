/**
 * Small `123/500` counter for a text input/textarea. Turns warning-coloured
 * as it approaches the limit. Pair with a `maxLength` on the field itself.
 */
export default function CharCount({
  value,
  max,
  className = "",
}: {
  value: string;
  max: number;
  className?: string;
}) {
  const n = value.length;
  const near = n >= max * 0.9;
  return (
    <span
      aria-live="polite"
      className={`block text-2xs tabular-nums text-right mt-1 ${
        near ? "text-warning" : "text-base-content/40"
      } ${className}`}
    >
      {n}/{max}
    </span>
  );
}
