import { describe, it, expect } from "vitest";
import { planNameCleanup } from "@/lib/nameCleanup";

describe("planNameCleanup", () => {
  it("plans no change for names that are already clean", () => {
    const plan = planNameCleanup({ firstName: "Rico", lastName: "Cadag", adviserTeacherName: "Ms. Santos" });
    expect(plan).toEqual({ changes: {}, unfixable: [] });
  });

  it("lists only the fields that change", () => {
    const plan = planNameCleanup({ firstName: "alejandro D", lastName: "Beato", adviserTeacherName: "MARIA SANTOS" });
    expect(plan.changes).toEqual({ firstName: "Alejandro D", adviserTeacherName: "Maria Santos" });
    expect(plan.unfixable).toEqual([]);
  });

  it("repairs Zalgo text", () => {
    const plan = planNameCleanup({ firstName: "A͇̽͑ngelica", lastName: "Santos", adviserTeacherName: null });
    expect(plan.changes).toEqual({ firstName: "Angelica" });
  });

  it("skips a missing or empty adviser name", () => {
    expect(planNameCleanup({ firstName: "Juan", lastName: "Cruz", adviserTeacherName: null }).unfixable).toEqual([]);
    expect(planNameCleanup({ firstName: "Juan", lastName: "Cruz", adviserTeacherName: "" }).unfixable).toEqual([]);
  });

  it("flags a name it cannot repair instead of changing it", () => {
    const plan = planNameCleanup({ firstName: "Juan123", lastName: "cruz", adviserTeacherName: null });
    expect(plan.unfixable).toEqual(["firstName"]);
    expect(plan.changes).toEqual({ lastName: "Cruz" });
  });
});
