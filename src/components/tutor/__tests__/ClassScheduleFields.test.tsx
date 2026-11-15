// @vitest-environment jsdom
import { act, createElement as h, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ClassScheduleFields from "../ClassScheduleFields";

const extra = Array.from({ length: 9 }, (_, i) => `Number practice ${i + 1}`);
const catalog = [
  { slug: "MATH", name: "Mathematics", gradeLevels: ["GRADE_7", "GRADE_8"], topics: ["Numbers", "Geometry", ...extra], topicGrades: { Numbers: ["GRADE_7"], Geometry: ["GRADE_8"], ...Object.fromEntries(extra.map(t => [t, ["GRADE_7"]])) } },
  { slug: "SCIENCE", name: "Science", gradeLevels: ["GRADE_7"], topics: ["Matter"], topicGrades: { Matter: ["GRADE_7"] } },
  { slug: "RESEARCH", name: "Research", gradeLevels: ["GRADE_11"], topics: ["Research Design"], topicGrades: { "Research Design": ["GRADE_11"] } },
];
let host: HTMLDivElement, root: Root;
const submit = vi.fn();
const select = (name: string) => host.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
const options = (element: HTMLSelectElement) => [...element.options].map(o => o.value);
const checkbox = (topic: string) => [...host.querySelectorAll('input[type="checkbox"]')].find(input => input.closest("label")?.textContent?.trim() === topic) as HTMLInputElement | undefined;
async function render(props: Partial<ComponentProps<typeof ClassScheduleFields>> = {}) {
  await act(async () => root.render(h(ClassScheduleFields, { tutorGradeLevel: "GRADE_12", onCancel: vi.fn(), onSubmit: submit, ...props })));
}
async function change(element: HTMLSelectElement | HTMLInputElement, value: string) {
  await act(async () => {
    if (element instanceof HTMLInputElement) Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function click(element: HTMLElement) { await act(async () => element.click()); }
async function choose(grade = "GRADE_7", subject = "MATH", topic = "Numbers") {
  await change(select("gradeLevel"), grade); await change(select("subject"), subject); await click(checkbox(topic)!);
}
async function addSession() {
  await click([...host.querySelectorAll("button")].find(button => button.textContent?.toLowerCase().includes("add session"))!);
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  submit.mockReset();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subjects: catalog }) }));
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

describe("grade-first class scheduling", () => {
  it("requires grade first and keeps subject/topics unavailable until it is selected", async () => {
    await render();
    expect([...host.querySelectorAll("select[name]")].slice(0, 2).map(s => s.getAttribute("name"))).toEqual(["gradeLevel", "subject"]);
    expect(select("gradeLevel").required).toBe(true);
    expect(select("subject").disabled).toBe(true);
    expect(options(select("subject"))).toEqual([""]);
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    await change(select("gradeLevel"), "GRADE_7");
    expect(select("subject").disabled).toBe(false);
    expect(options(select("subject"))).toEqual(["", "MATH", "SCIENCE"]);
    await change(select("subject"), "MATH");
    expect(checkbox("Numbers")).toBeDefined();
    expect(checkbox("Geometry")).toBeUndefined();
    await change(select("gradeLevel"), "GRADE_11");
    expect(select("subject").value).toBe("");
    expect(options(select("subject"))).toEqual(["", "RESEARCH"]);
    expect(host.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0);
  });

  it("clears old session topics when grade changes while keeping the entered schedule", async () => {
    await render(); await choose(); await addSession();
    await change(host.querySelector<HTMLInputElement>('input[type="date"]')!, "2099-01-10");
    await change(host.querySelector<HTMLInputElement>('input[type="time"]')!, "15:00");
    await change(select("gradeLevel"), "GRADE_8");
    expect(select("subject").value).toBe("");
    await change(select("subject"), "MATH"); await click(checkbox("Geometry")!);
    expect(checkbox("Numbers")).toBeUndefined();
    const sessionTopic = host.querySelector<HTMLSelectElement>('select[data-session-control="topic"]')!;
    expect(sessionTopic.value).toBe("");
    expect(options(sessionTopic)).toEqual(["", "Geometry"]);
    expect(host.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe("2099-01-10");
    expect(host.querySelector<HTMLInputElement>('input[type="time"]')!.value).toBe("15:00");
  });

  it("clears the topic search and session selection when the subject changes", async () => {
    await render(); await choose(); await addSession();
    await change(host.querySelector<HTMLInputElement>('input[aria-label="Search available topics"]')!, "Numbers");
    await change(select("subject"), "SCIENCE");
    expect(checkbox("Matter")).toBeDefined();
    expect(host.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0);
    await click(checkbox("Matter")!);
    expect(host.querySelector<HTMLSelectElement>('select[data-session-control="topic"]')!.value).toBe("");
  });

  it("does not reuse a removed topic in a session when it is reselected", async () => {
    await render(); await choose(); await addSession();
    await click(checkbox("Numbers")!); await click(checkbox("Numbers")!);
    expect(host.querySelector<HTMLSelectElement>('select[data-session-control="topic"]')!.value).toBe("");
  });

  it("preserves the tutor grade limit and compatible prefilled request data", async () => {
    await render({ tutorGradeLevel: "GRADE_8", subjectLocked: true, initial: { gradeLevel: "GRADE_7", subject: "MATH", topics: ["Numbers"], sessionRows: [{ key: "prefilled", topic: "Numbers", date: "2099-01-10", time: "15:00", duration: 60 }] } });
    expect(options(select("gradeLevel"))).toEqual(["", "GRADE_7", "GRADE_8"]);
    expect(select("subject").value).toBe("MATH"); expect(select("subject").disabled).toBe(true);
    expect(checkbox("Numbers")!.checked).toBe(true);
    expect(host.querySelector<HTMLSelectElement>('select[data-session-control="topic"]')!.value).toBe("Numbers");
  });

  it("submits the chosen grade, subject and current session topic together", async () => {
    await render(); await choose(); await addSession();
    await change(host.querySelector<HTMLInputElement>('input[type="date"]')!, "2099-01-10");
    await change(host.querySelector<HTMLInputElement>('input[type="time"]')!, "15:00");
    await change(host.querySelector<HTMLInputElement>('input[name="building"]')!, "QA Classroom");
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0][0]).toMatchObject({ gradeLevel: "GRADE_7", subject: "MATH", topics: ["Numbers"], sessions: [{ topic: "Numbers", scheduledAt: "2099-01-10T07:00:00.000Z", duration: 60 }] });
  });
});
