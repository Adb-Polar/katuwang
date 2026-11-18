// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudentRoster from "../StudentRoster";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/tutor/students",
  useSearchParams: () => searchParams,
}));

const classes = [
  { id: "c1", code: "C-0001", subject: "MATH" },
  { id: "c2", code: "C-0002", subject: "MATH" },
  { id: "c3", code: "C-0003", subject: "SCIENCE" },
];
let host: HTMLDivElement, root: Root;
const classSelect = () => host.querySelector<HTMLSelectElement>('[data-form-field="Class"] select')!;
const options = () => [...classSelect().options].map(option => ({ value: option.value, label: option.textContent }));
async function choose(value: string) {
  await act(async () => {
    classSelect().value = value;
    classSelect().dispatchEvent(new Event("change", { bubbles: true }));
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  searchParams.delete("studentsPage");
  navigation.push.mockClear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ students: [], total: 0, classes }) }));
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("student roster class filter", () => {
  it("uses enrolled class choices from the roster response, including classes absent from the current page", async () => {
    await act(async () => root.render(h(StudentRoster)));
    expect(options()).toEqual([
      { value: "", label: "All classes" },
      { value: "c1", label: "C-0001 — Mathematics" },
      { value: "c2", label: "C-0002 — Mathematics" },
      { value: "c3", label: "C-0003 — Science" },
    ]);
    expect(host.querySelector('[data-form-field="Subject"]')).toBeNull();
    expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).startsWith("/api/tutor/students?"))).toBe(true);
    await choose("c2");
    expect(new URL(String(vi.mocked(fetch).mock.lastCall![0]), "http://localhost").searchParams.get("classId")).toBe("c2");
    expect(options()).toHaveLength(4);
    expect(classSelect().value).toBe("c2");
    await choose("");
    expect(new URL(String(vi.mocked(fetch).mock.lastCall![0]), "http://localhost").searchParams.has("classId")).toBe(false);
  });

  it("resets pagination when choosing a class", async () => {
    searchParams.set("studentsPage", "3");
    await act(async () => root.render(h(StudentRoster)));
    await choose("c1");
    expect(navigation.push).toHaveBeenCalledWith("/tutor/students?studentsPage=1", { scroll: false });
  });

  it("keeps only All classes when the tutor has no enrolled classes", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ students: [], total: 0, classes: [] }) } as Response);
    await act(async () => root.render(h(StudentRoster)));
    expect(options()).toEqual([{ value: "", label: "All classes" }]);
    expect(host.textContent).toContain("No students match these filters yet.");
  });

  it("lists each student by ID with their classes by topic, subject and code", async () => {
    const student = {
      id: "u1", anonymousId: "STU-0042", image: null, gradeLevel: "GRADE_8", section: "Rizal",
      enrollments: [
        { classId: "c1", code: "C-0001", subject: "MATH", topics: ["Fractions"], enrolledAt: "2026-11-01T00:00:00Z" },
        { classId: "c3", code: "C-0003", subject: "SCIENCE", topics: ["Cells"], enrolledAt: "2026-11-01T00:00:00Z", withdrawnAt: "2026-11-05T00:00:00Z" },
      ],
    };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ students: [student], total: 1, classes }) } as Response);
    await act(async () => root.render(h(StudentRoster)));
    expect(host.querySelector('a[href="/tutor/students/u1"]')?.textContent).toBe("STU-0042");
    expect(host.textContent).toContain("Grade 8 · Section Rizal");
    expect(host.querySelector('a[href="/tutor/classes/c1"]')?.textContent).toBe("Fractions");
    expect(host.textContent).toContain("Cells · Science · C-0003 · withdrawn");
    expect(host.textContent).toContain("1 student");
  });
});
