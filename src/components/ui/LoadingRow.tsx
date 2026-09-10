/**
 * Centered spinner shown while a list/panel loads. Defaults match the admin
 * tables (`py-10`, `loading-md`, `text-primary`).
 */
export default function LoadingRow({
  size = "md",
  padding = "py-10",
}: {
  size?: "sm" | "md" | "lg";
  padding?: string;
}) {
  const spinner =
    size === "sm"
      ? "loading-sm"
      : size === "lg"
        ? "loading-lg"
        : "loading-md";
  return (
    <div className={`flex justify-center items-center ${padding}`}>
      <span className={`loading loading-spinner ${spinner} text-primary`} />
    </div>
  );
}
