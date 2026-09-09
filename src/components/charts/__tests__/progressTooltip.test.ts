import { describe, expect, it } from "vitest";
import { buildProgressTooltipRows, type SeriesLike } from "../progressTooltip";

const SERIES: SeriesLike[] = [
  { key: "pre", name: "Pre-test", color: "#a" },
  { key: "post", name: "Post-test", color: "#b" },
];

describe("buildProgressTooltipRows", () => {
  it("keeps series declaration order (pre before post)", () => {
    const rows = buildProgressTooltipRows({ pre: 40, post: 80 }, undefined, SERIES, "%");
    expect(rows.map((r) => r.key)).toEqual(["pre", "post"]);
    expect(rows.map((r) => r.name)).toEqual(["Pre-test", "Post-test"]);
  });

  it("renders each score with the unit", () => {
    const rows = buildProgressTooltipRows({ pre: 40, post: 80 }, undefined, SERIES, "%");
    expect(rows[0]).toMatchObject({ value: 40, text: "40%" });
    expect(rows[1]).toMatchObject({ value: 80, text: "80%" });
  });

  it("shows 'not taken yet' — never a number — when the post score is null", () => {
    const rows = buildProgressTooltipRows({ pre: 33, post: null }, undefined, SERIES, "%");
    expect(rows[0]).toMatchObject({ value: 33, text: "33%" });
    expect(rows[1]).toMatchObject({ value: null, text: "not taken yet" });
    expect(rows[1].text).not.toMatch(/\d/);
    expect(rows[1].text).not.toContain("null");
  });

  it("treats a missing key and an empty string as not-taken", () => {
    const rows = buildProgressTooltipRows({ pre: 50 }, undefined, SERIES, "%");
    expect(rows[1]).toMatchObject({ value: null, text: "not taken yet" });
    const rows2 = buildProgressTooltipRows({ pre: 50, post: "" }, undefined, SERIES, "%");
    expect(rows2[1].value).toBeNull();
  });

  it("does NOT fall back to a stale value from another point", () => {
    // recharts sometimes hands the tooltip a payload whose row is partial; the
    // fallback only reads the entry for THIS series, and only if it has a value.
    const rows = buildProgressTooltipRows(
      undefined,
      [
        { dataKey: "pre", value: 33, payload: {} },
        { dataKey: "post", value: null, payload: {} },
      ],
      SERIES,
      "%",
    );
    expect(rows[0].text).toBe("33%");
    expect(rows[1].text).toBe("not taken yet");
  });

  it("respects a custom missing label", () => {
    const rows = buildProgressTooltipRows({ pre: 1, post: null }, undefined, SERIES, "%", "—");
    expect(rows[1].text).toBe("—");
  });
});
