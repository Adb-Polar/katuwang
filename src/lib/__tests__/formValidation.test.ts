// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fieldValidationMessage } from "../formValidation";

function input(attrs: Record<string, string>) {
  const el = document.createElement("input");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

describe("fieldValidationMessage", () => {
  it("uses the generic message for an empty required field", () => {
    expect(fieldValidationMessage(input({ type: "date", required: "" }))).toBe("Please fill in this field.");
  });

  it("uses data-required-message when the field provides one", () => {
    expect(fieldValidationMessage(input({ type: "date", required: "", "data-required-message": "Pick a date." }))).toBe("Pick a date.");
  });
});
