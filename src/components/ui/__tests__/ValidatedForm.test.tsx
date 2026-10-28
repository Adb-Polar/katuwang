// @vitest-environment jsdom

import { act, createElement as h, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "@/components/auth/LoginForm";
import ValidatedForm from "../ValidatedForm";
import FormField from "../FormField";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import ClassScheduleFields from "@/components/tutor/ClassScheduleFields";
import QuestionFormModal from "@/components/quiz/QuestionFormModal";
import { reportServerFieldErrors } from "@/lib/formValidation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({push: vi.fn(), refresh: vi.fn()}),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(async () => ({error: "Invalid email or password."})),
}));

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const submit = async () => act(async () => {
  host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
});
const change = async (input: HTMLInputElement | HTMLTextAreaElement, value: string) => act(async () => {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

describe("inline form validation", () => {
  it("blocks invalid submission, focuses the first failure, and associates each inline error", async () => {
    const save = vi.fn();
    await act(async () => root.render(
      <ValidatedForm onSubmit={save}>
        <FormField label="Name"><input required name="name" /></FormField>
        <FormField label="Email"><input required type="email" name="email" /></FormField>
      </ValidatedForm>
    ));
    await submit();
    expect(save).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(host.querySelector("input"));
    expect(host.querySelectorAll('[role="alert"]')).toHaveLength(2);
    for (const input of host.querySelectorAll("input")) {
      const error = input.closest("[data-form-field]")!.querySelector('[role="alert"]')!;
      expect(input.getAttribute("aria-describedby")).toBe(error.id);
      expect(input.getAttribute("aria-invalid")).toBe("true");
    }
    await change(host.querySelector("input")!, "Alice");
    expect(host.querySelector("input")!.hasAttribute("aria-invalid")).toBe(false);
    expect(document.activeElement).toBe(host.querySelector("input"));
  });

  it.each([
    { props: { required: true, defaultValue: "   " }, description: "whitespace" },
    { props: { type: "email", defaultValue: "wrong" }, description: "email format" },
    { props: { type: "number", min: 1, max: 10, defaultValue: "11" }, description: "numeric bounds" },
    { props: { type: "text", minLength: 8, defaultValue: "short" }, description: "visible password length" },
  ])("checks $description", async ({ props }) => {
    const save = vi.fn();
    await act(async () => root.render(h(ValidatedForm, { onSubmit: save }, h(FormField, { label: "Field", children: h("input", props) }))));
    await submit();
    expect(save).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(host.querySelector("input"));
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("submits a valid form", async () => {
    const save = vi.fn((event) => event.preventDefault());
    await act(async () => root.render(<ValidatedForm onSubmit={save}><input required defaultValue="Valid" /></ValidatedForm>));
    await submit();
    expect(save).toHaveBeenCalledOnce();
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("focuses password confirmation for a mismatch and current password for a server failure", async () => {
    await act(async () => root.render(<ChangePasswordForm endpoint="/test-password" />));
    const inputs = host.querySelectorAll("input");
    await change(inputs[0], "Existing secret");
    await change(inputs[1], "Better secret123");
    await change(inputs[2], "Different secret123");
    await submit();
    expect(document.activeElement).toBe(inputs[2]);
    expect(inputs[2].closest("[data-form-field]")!.textContent).toContain("do not match");
    await change(inputs[2], "Better secret123");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ fieldErrors: [{ path: ["currentPassword"], message: "Current password is incorrect." }] }) })));
    await submit();
    expect(document.activeElement).toBe(inputs[0]);
    expect(inputs[0].closest("[data-form-field]")!.textContent).toContain("Current password is incorrect.");
  });

  it("validates question options and resolves nested server paths to the correct option", async () => {
    const save = vi.fn();
    await act(async () => root.render(<QuestionFormModal title="Question" submitLabel="Save" onSubmit={save} onClose={() => {}} />));
    await submit();
    expect(document.activeElement).toBe(host.querySelector("textarea"));
    await change(host.querySelector("textarea")!, "A valid question?");
    await submit();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Option 1 text");
    await act(async () => { reportServerFieldErrors(host.querySelector("form")!, { fieldErrors: [{ path: ["options", 2, "text"], message: "Third option is invalid." }] }); });
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Option 3 text");
    const row = document.activeElement!.closest("[data-control-field]")!;
    expect(row.querySelector('[role="alert"]')!.textContent).toBe("Third option is invalid.");
  });
  it("focuses the add-session action, then the missing date in a newly added session", async () => {
    await act(async () => root.render(<ClassScheduleFields initial={{subject: "MATH", topics: ["Algebra"]}} onCancel={() => {}} onSubmit={vi.fn()} />));
    await submit();
    expect(document.activeElement?.textContent).toContain("Add Session");
    expect(document.activeElement?.closest("[data-form-field]")?.textContent).toContain("Please add at least one session.");
    await act(async () => { (document.activeElement as HTMLButtonElement).click(); });
    await submit();
    expect(document.activeElement?.getAttribute("type")).toBe("date");
    expect(document.activeElement?.closest("[data-control-field]")?.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("focuses server errors after a pending form re-enables its inputs", async () => {
    function PendingForm() {
      const [pending, setPending] = useState(false);
      return <ValidatedForm onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        await Promise.resolve();
        reportServerFieldErrors(form, {fieldErrors: [{path: ["email"], message: "Email already exists."}]});
        setPending(false);
      }}><FormField label="Email Address"><input type="email" defaultValue="a@example.com" disabled={pending} /></FormField></ValidatedForm>;
    }
    await act(async () => root.render(<PendingForm />));
    await submit();
    expect(document.activeElement).toBe(host.querySelector("input"));
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Email already exists.");
  });

  it("focuses the password field when sign-in credentials are rejected", async () => {
    await act(async () => root.render(<LoginForm />));
    const inputs = host.querySelectorAll("input");
    await change(inputs[0], "a@example.com");
    await change(inputs[1], "Wrong secret123");
    await submit();
    expect(document.activeElement).toBe(inputs[1]);
    expect(inputs[1].closest("[data-form-field]")?.querySelector('[role="alert"]')?.textContent).toContain("Invalid email or password");
  });

});
