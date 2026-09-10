"use client";

import { useMemo, useRef, useState } from "react";
import {
  BarChartCard,
  DeltaBar,
  GroupedBarChart,
  ProgressAreaChart,
  RateBarChart,
} from "@/components/charts";

// ─── helpers ───────────────────────────────────────────────────────────────

/** A cell is stored as raw text; "" (blank) parses to null = "not taken". */
type Cell = string;
const parseCell = (c: Cell): number | null => {
  const t = c.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

interface PairRow {
  id: string;
  label: string;
  pre: Cell;
  post: Cell;
}
interface CountRow {
  id: string;
  label: string;
  count: Cell;
}

const PRE_POST_SERIES = [
  { key: "pre", name: "Pre-test", color: "var(--color-accent)" },
  { key: "post", name: "Post-test", color: "var(--color-success)" },
];

// ─── scenario presets for the pre/post editor ──────────────────────────────

const PAIR_SCENARIOS: Record<string, Omit<PairRow, "id">[]> = {
  "Typical (one unpaired)": [
    { label: "C-01 · Fractions", pre: "40", post: "78" },
    { label: "C-01 · Ratios", pre: "55", post: "62" },
    { label: "C-01 · Fractions", pre: "33", post: "71" },
    { label: "C-01 · Algebra", pre: "48", post: "" },
    { label: "C-01 · Algebra", pre: "67", post: "83" },
  ],
  "Duplicate labels": [
    { label: "Algebraic Expressions", pre: "20", post: "70" },
    { label: "Algebraic Expressions", pre: "35", post: "75" },
    { label: "Algebraic Expressions", pre: "60", post: "88" },
  ],
  "All post missing": [
    { label: "Session 1", pre: "42", post: "" },
    { label: "Session 2", pre: "51", post: "" },
    { label: "Session 3", pre: "38", post: "" },
  ],
  "Negative & zero deltas": [
    { label: "Regressed", pre: "80", post: "50" },
    { label: "Flat", pre: "60", post: "60" },
    { label: "Improved", pre: "30", post: "78" },
    { label: "Unpaired", pre: "45", post: "" },
  ],
  "Single row": [{ label: "Only session", pre: "50", post: "82" }],
  Empty: [],
};

const QUESTION_PRESET: Omit<PairRow, "id">[] = [
  { label: "Q1", pre: "45", post: "80" },
  { label: "Q2", pre: "60", post: "70" },
  { label: "Q3", pre: "30", post: "92" },
  { label: "Q4", pre: "75", post: "75" },
  { label: "Q5", pre: "20", post: "55" },
  { label: "Q6", pre: "58", post: "40" },
];

const COUNT_PRESET: Omit<CountRow, "id">[] = [
  { label: "GRADE_7", count: "12" },
  { label: "GRADE_8", count: "19" },
  { label: "GRADE_9", count: "8" },
  { label: "GRADE_10", count: "24" },
  { label: "GRADE_11", count: "15" },
  { label: "GRADE_12", count: "6" },
];

// ─── row-id factory (stable keys across edits) ─────────────────────────────

function useIds() {
  const n = useRef(0);
  return () => `row-${++n.current}`;
}

// ─── editors ──────────────────────────────────────────────────────────────

function PairEditor({
  rows,
  setRows,
  makeId,
  valueLabels = ["Pre", "Post"],
}: {
  rows: PairRow[];
  setRows: (r: PairRow[]) => void;
  makeId: () => string;
  valueLabels?: [string, string];
}) {
  const patch = (id: string, key: keyof PairRow, value: string) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs">
        <thead>
          <tr className="text-2xs uppercase">
            <th>Label</th>
            <th className="w-24">{valueLabels[0]}</th>
            <th className="w-24">{valueLabels[1]}</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <input
                  className="input input-bordered input-xs w-full min-w-40"
                  value={r.label}
                  onChange={(e) => patch(r.id, "label", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="input input-bordered input-xs w-20"
                  inputMode="numeric"
                  placeholder="blank"
                  value={r.pre}
                  onChange={(e) => patch(r.id, "pre", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="input input-bordered input-xs w-20"
                  inputMode="numeric"
                  placeholder="blank"
                  value={r.post}
                  onChange={(e) => patch(r.id, "post", e.target.value)}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
                  aria-label="Delete row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="btn btn-outline btn-xs mt-2"
        onClick={() => setRows([...rows, { id: makeId(), label: `Row ${rows.length + 1}`, pre: "", post: "" }])}
      >
        + Add row
      </button>
      <p className="mt-1 text-2xs text-base-content/50">
        Leave a value <span className="font-mono">blank</span> to mean &ldquo;not taken&rdquo; (null).
      </p>
    </div>
  );
}

function CountEditor({
  rows,
  setRows,
  makeId,
}: {
  rows: CountRow[];
  setRows: (r: CountRow[]) => void;
  makeId: () => string;
}) {
  const patch = (id: string, key: keyof CountRow, value: string) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs">
        <thead>
          <tr className="text-2xs uppercase">
            <th>Label</th>
            <th className="w-24">Count</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <input
                  className="input input-bordered input-xs w-full min-w-40"
                  value={r.label}
                  onChange={(e) => patch(r.id, "label", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="input input-bordered input-xs w-20"
                  inputMode="numeric"
                  value={r.count}
                  onChange={(e) => patch(r.id, "count", e.target.value)}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
                  aria-label="Delete row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="btn btn-outline btn-xs mt-2"
        onClick={() => setRows([...rows, { id: makeId(), label: `Cat ${rows.length + 1}`, count: "0" }])}
      >
        + Add row
      </button>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────

export default function DevChartLab() {
  const makeId = useIds();
  const seed = (rows: Omit<PairRow, "id">[]) => rows.map((r) => ({ ...r, id: makeId() }));
  const seedC = (rows: Omit<CountRow, "id">[]) => rows.map((r) => ({ ...r, id: makeId() }));

  const [pairRows, setPairRows] = useState<PairRow[]>(() => seed(PAIR_SCENARIOS["Typical (one unpaired)"]));
  const [qRows, setQRows] = useState<PairRow[]>(() => seed(QUESTION_PRESET));
  const [countRows, setCountRows] = useState<CountRow[]>(() => seedC(COUNT_PRESET));

  // parsed datasets ─────────────────────────────────────────────────────────
  const sessionData = useMemo(
    () => pairRows.map((r) => ({ label: r.label, pre: parseCell(r.pre), post: parseCell(r.post) })),
    [pairRows],
  );
  const deltaRows = useMemo(
    () =>
      sessionData.map((r) => ({
        ...r,
        delta: r.pre != null && r.post != null ? r.post - r.pre : null,
      })),
    [sessionData],
  );
  const questionData = useMemo(
    () =>
      qRows.map((r) => {
        const pre = parseCell(r.pre);
        const post = parseCell(r.post);
        return {
          label: r.label,
          prompt: r.label,
          pre,
          post,
          deltaRate: pre != null && post != null ? post - pre : null,
        };
      }),
    [qRows],
  );
  const countData = useMemo(
    () => countRows.map((r) => ({ name: r.label, count: parseCell(r.count) ?? 0 })),
    [countRows],
  );

  return (
    <div className="space-y-8">
      {/* ── shared pre/post dataset ── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-sans text-lg text-base-content">Pre / post series</h2>
          <span className="text-2xs text-base-content/50">
            feeds charts (a) grouped bars · (b) area · (d) per-row delta
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PAIR_SCENARIOS).map((name) => (
            <button
              key={name}
              type="button"
              className="btn btn-xs"
              onClick={() => setPairRows(seed(PAIR_SCENARIOS[name]))}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="rounded-xl border border-base-200 bg-base-100 p-3">
            <PairEditor rows={pairRows} setRows={setPairRows} makeId={makeId} />
            <details className="mt-3">
              <summary className="cursor-pointer text-2xs text-base-content/50">Parsed JSON</summary>
              <pre className="mt-1 max-h-48 overflow-auto rounded bg-base-200 p-2 text-2xs">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </details>
          </div>

          <div className="space-y-4">
            <GroupedBarChart
              title="(a) Pre vs post average, by session"
              data={sessionData}
              xKey="label"
              series={PRE_POST_SERIES}
              unit="%"
              yDomain={[0, 100]}
              emptyHint="No rows."
            />
            <ProgressAreaChart
              title="(b) Pre vs post score, by session"
              data={sessionData}
              xKey="label"
              series={PRE_POST_SERIES}
            />
            <DeltaBar title="(d) Per-row gain (post − pre)" rows={deltaRows} />
          </div>
        </div>
      </section>

      {/* ── per-question rate ── */}
      <section className="space-y-3">
        <h2 className="font-sans text-lg text-base-content">
          Per-question rate <span className="text-2xs text-base-content/50">feeds chart (c)</span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-xs" onClick={() => setQRows(seed(QUESTION_PRESET))}>
            Reset
          </button>
          <button type="button" className="btn btn-xs" onClick={() => setQRows([])}>
            Empty
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="rounded-xl border border-base-200 bg-base-100 p-3">
            <PairEditor rows={qRows} setRows={setQRows} makeId={makeId} valueLabels={["Pre %", "Post %"]} />
          </div>
          <RateBarChart
            title="(c) Per-question correct rate — pre vs post"
            data={questionData}
            series={PRE_POST_SERIES}
            emptyHint="No questions."
          />
        </div>
      </section>

      {/* ── single-series category bars ── */}
      <section className="space-y-3">
        <h2 className="font-sans text-lg text-base-content">
          Single-series bars{" "}
          <span className="text-2xs text-base-content/50">BarChartCard (admin Reports)</span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-xs" onClick={() => setCountRows(seedC(COUNT_PRESET))}>
            Reset
          </button>
          <button type="button" className="btn btn-xs" onClick={() => setCountRows([])}>
            Empty
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="rounded-xl border border-base-200 bg-base-100 p-3">
            <CountEditor rows={countRows} setRows={setCountRows} makeId={makeId} />
          </div>
          <BarChartCard title="Users by grade level" rows={countData} labelKey="name" color="var(--color-primary)" />
        </div>
      </section>
    </div>
  );
}
