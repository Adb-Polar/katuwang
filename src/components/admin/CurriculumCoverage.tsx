"use client";

import { useState } from "react";
import { CURRICULUM_GRADES, gradeCoverageLabel, readGradeLevels } from "@/lib/curriculum";

export function GradeChoices({ value, onChange, disabled = false }: {
  value: string[]; onChange: (grades: string[]) => void; disabled?: boolean;
}) {
  return <fieldset disabled={disabled} className="flex flex-wrap gap-x-3 gap-y-1">
    <legend className="mb-1 text-2xs text-base-content/60">Grade coverage</legend>
    {CURRICULUM_GRADES.map((grade) => <label key={grade} className="flex items-center gap-1 text-2xs">
      <input type="checkbox" className="checkbox checkbox-xs" checked={value.includes(grade)}
        onChange={(e) => onChange(CURRICULUM_GRADES.filter((g) => g === grade ? e.target.checked : value.includes(g)))} />
      {grade.replace("GRADE_", "")}
    </label>)}
  </fieldset>;
}

export default function CurriculumCoverage({ gradeLevels, curriculum, disabled, onSave }: {
  gradeLevels: unknown; curriculum: unknown; disabled: boolean;
  onSave: (grades: string[], note: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [grades, setGrades] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const evidence = curriculum && typeof curriculum === "object" ? curriculum as {
    status?: string; note?: string; reviewedAt?: string; sources?: { title: string; url: string }[];
  } : null;
  return <details className="mt-1 text-2xs text-base-content/60">
    <summary className="cursor-pointer">{gradeCoverageLabel(gradeLevels)}
      {evidence?.status === "foundation" && " · foundation review"}
      {evidence?.status === "legacy" && " · legacy coverage; review needed"}
    </summary>
    <div className="space-y-2 py-2">
      {evidence?.note && <p>{evidence.note}</p>}
      {evidence?.reviewedAt && <p>Reviewed {evidence.reviewedAt}</p>}
      {evidence?.sources?.map((source) => /^https:\/\//.test(source.url) &&
        <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="block underline">{source.title}</a>)}
      {editing ? <>
        <GradeChoices value={grades} onChange={setGrades} disabled={disabled} />
        <textarea aria-label="Grade coverage explanation" className="textarea textarea-bordered textarea-xs w-full"
          value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000}
          placeholder="Explain the grade assignment and curriculum basis" />
        <button type="button" className="btn btn-primary btn-xs" disabled={disabled || !grades.length}
          onClick={async () => { if (await onSave(grades, note)) setEditing(false); }}>Save grades</button>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditing(false)}>Cancel</button>
      </> : <button type="button" className="btn btn-ghost btn-xs" disabled={disabled}
        onClick={() => { setGrades(readGradeLevels(gradeLevels)); setNote(""); setEditing(true); }}>Edit grades</button>}
    </div>
  </details>;
}
