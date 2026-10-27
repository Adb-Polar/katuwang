"use client";
import { GRADE_LEVELS } from "@/lib/gradeLevels";
export default function CatalogGradePicker({ value, onChange, disabled = false, label = "Grade levels" }: {
  value: unknown; onChange: (grades: string[]) => void; disabled?: boolean; label?: string;
}) {
  const grades: string[] = Array.isArray(value) ? value : [];
  return <details className="text-xs">
    <summary className="cursor-pointer py-1">{label}: {grades.length ? grades.map((g) => g.replace("GRADE_", "")).join(", ") : "All grades"}</summary>
    <div className="flex flex-wrap gap-2 py-2">
      {GRADE_LEVELS.map((g) => <label key={g.value} className="flex items-center gap-1">
        <input type="checkbox" disabled={disabled} className="checkbox checkbox-xs" checked={grades.includes(g.value)}
          onChange={() => onChange(grades.includes(g.value) ? grades.filter((v) => v !== g.value) : [...grades, g.value])} />{g.label}
      </label>)}
    </div>
    <p className="text-base-content/50">No selection means all grades. Topics also follow their subject’s grades.</p>
  </details>;
}
