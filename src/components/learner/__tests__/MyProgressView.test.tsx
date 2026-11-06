// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type GroupedBarChart from "@/components/charts/GroupedBarChart";

const chart = vi.hoisted(() => vi.fn<(props: ComponentProps<typeof GroupedBarChart>) => null>(() => null));
vi.mock("@/components/charts", () => ({ GroupedBarChart: chart }));
import MyProgressView from "../MyProgressView";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("compares discrete sessions without treating missing scores as zero and labels gains in percentage points", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({
    summary: { sessionsWithTest: 3, pairedCount: 2, avgDelta: 10 },
    series: [
      { classCode: "C-1", topic: "Algebra", scheduledAt: "2026-11-06T23:00:00Z", preScore: 0, postScore: 40, delta: 40 },
      { classCode: "C-1", topic: "Algebra", scheduledAt: "2026-11-08T07:00:00Z", preScore: 60, postScore: null, delta: null },
      { classCode: "C-2", topic: "Geometry", scheduledAt: "2026-11-09T07:00:00Z", preScore: 80, postScore: 60, delta: -20 },
    ],
  }) })));
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MyProgressView />));
    const props = chart.mock.calls.at(-1)![0] as ComponentProps<typeof GroupedBarChart>;
    expect(props.yDomain).toEqual([0, 100]);
    expect(props.unit).toBe("%");
    expect(props.missingLabel).toBe("Not taken yet");
    expect(props.data[0].label).toContain("Nov 7, 2026"); // School timezone.
    expect(props.data.map((r) => r.session)).toEqual(["Session 1", "Session 2", "Session 3"]);
    const columns = props.tableColumns!;
    expect(columns.find((c) => c.header === "Pre-test")!.cell(props.data[0])).toBe("0%");
    expect(columns.find((c) => c.header === "Post-test")!.cell(props.data[1])).toBe("Not taken yet");
    const gain = columns.find((c) => c.header === "Gain")!;
    expect(gain.cell(props.data[0])).toBe("+40 percentage points");
    expect(gain.cell(props.data[1])).toBe("Awaiting paired scores");
    expect(gain.cell(props.data[2])).toBe("-20 percentage points");
    expect(host.textContent).toContain("percentage points · paired tests only");
  } finally { await act(async () => root.unmount()); }
});
