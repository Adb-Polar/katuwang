/** Native constraints plus whitespace checks, also used when password visibility is toggled. */
export function fieldValidationMessage(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field.disabled || !field.willValidate) return "";
  if (field.required && !field.value.trim() && field.type !== "checkbox" && field.type !== "radio") return "Please fill in this field.";
  if ("minLength" in field && field.minLength > 0 && field.value && field.value.length < field.minLength) return `Use at least ${field.minLength} characters.`;
  if ("maxLength" in field && field.maxLength > 0 && field.value.length > field.maxLength) return `Use no more than ${field.maxLength} characters.`;
  if (field.dataset.after && field.value && field.value <= field.dataset.after) return "End time must be after the start time.";
  return field.validity.valid ? "" : field.validationMessage;
}

/** Send a custom validation failure to the owning form without a page-level banner. */
export function reportFieldError(form: EventTarget, label: string, message: string) {
  form.dispatchEvent(new CustomEvent("field-error", { detail: { label, message } }));
}

export type ServerFieldError = { path: PropertyKey[]; message: string };
const FIELD_LABELS: Record<string, string[]> = {
  consentGiven: ["Consent"],
  firstName: ["First Name"], lastName: ["Last Name"], email: ["Email Address", "Email"],
  password: ["Password", "New Password"], newPassword: ["New password"], currentPassword: ["Current password"],
  gradeLevel: ["Grade level", "Target Grade"], section: ["Section"], contactInfo: ["Contact info"],
  subject: ["Subject Area", "Subject"], topics: ["Topic(s)", "Topics"], topic: ["Topic"],
  sessions: ["Sessions"], scheduledAt: ["Date & Time"], maxStudents: ["Max Capacity", "Capacity"],
  meetingLink: ["Meeting Link"], building: ["Location"], room: ["Location"],
  preferredSlots: ["Preferred times"], violations: ["Violations"], details: ["Describe the issue"],
  prompt: ["Question prompt"], options: ["Options"], reason: ["Reason", "Why should this moderation"],
  durationDays: ["Duration"], resolutionNote: ["Note for the tutor"], status: ["Status"],
  title: ["Title"], instructions: ["Instructions"], description: ["Description"], note: ["Note"],
};

/** Returns false for non-field errors, which should remain in the general banner. */
export function reportServerFieldErrors(form: EventTarget, data: { fieldErrors?: ServerFieldError[] }) {
  if (!(form instanceof HTMLFormElement) || !data.fieldErrors?.length) return false;
  const fields = Array.from(form.querySelectorAll<HTMLElement>("[data-form-field]"));
  for (const issue of data.fieldErrors) {
    const key = String(issue.path[0]);
    const labels = FIELD_LABELS[key] ?? [key];
    const field = fields.find((field) => labels.some((label) => field.dataset.formField?.toLowerCase().startsWith(label.toLowerCase())));
    if (field) {
      let target: HTMLElement | undefined;
      const index = issue.path[1];
      if (typeof index === "number") {
        if (key === "options") target = field.querySelectorAll<HTMLInputElement>('input[type="text"]')[index];
        if (key === "sessions") target = field.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')[index];
        if (key === "preferredSlots") target = field.querySelectorAll<HTMLInputElement>('input[type="time"]')[index * 2 + (issue.path[2] === "endTime" ? 1 : 0)];
      }
      form.dispatchEvent(new CustomEvent("field-error", { detail: { label: field.dataset.formField!, target, message: issue.message } }));
      return true;
    }
    const control = Array.from(form.elements).find((el) => el.getAttribute("name") === key) as HTMLElement | undefined;
    if (control) {
      form.dispatchEvent(new CustomEvent("field-error", { detail: { target: control, message: issue.message } }));
      return true;
    }
  }
  return false;
}

/** Carries API field details through callbacks such as question editors. */
export class FormValidationError extends Error {
  fieldErrors?: ServerFieldError[];
  constructor(data: { error?: string; fieldErrors?: ServerFieldError[] }, fallback: string) {
    super(data.error || fallback);
    this.fieldErrors = data.fieldErrors;
  }
}
