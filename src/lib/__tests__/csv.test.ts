import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("writes a header row from the first object's keys and one row per entry", () => {
    const out = toCsv([
      { section: "users_by_role", label: "STUDENT_LEARNER", count: 12 },
      { section: "users_by_role", label: "STUDENT_TUTOR", count: 4 },
    ]);
    expect(out).toBe(
      '"section","label","count"\r\n' +
        '"users_by_role","STUDENT_LEARNER","12"\r\n' +
        '"users_by_role","STUDENT_TUTOR","4"\r\n',
    );
  });

  it("uses the explicit header order and pulls those columns", () => {
    const out = toCsv([{ count: 3, label: "x", section: "s" }], ["section", "label", "count"]);
    expect(out.split("\r\n")[0]).toBe('"section","label","count"');
    expect(out.split("\r\n")[1]).toBe('"s","x","3"');
  });

  it("escapes commas, quotes and newlines inside a value", () => {
    const out = toCsv([{ label: 'a,b "c"\nd', count: 1 }], ["label", "count"]);
    expect(out).toBe('"label","count"\r\n"a,b ""c""\nd","1"\r\n');
  });

  it("renders null / undefined as an empty quoted field", () => {
    const out = toCsv([{ a: null, b: undefined, c: 0 }], ["a", "b", "c"]);
    expect(out).toBe('"a","b","c"\r\n"","","0"\r\n');
  });

  it("returns just a trailing CRLF for no rows and no headers", () => {
    expect(toCsv([])).toBe("\r\n");
  });
});
