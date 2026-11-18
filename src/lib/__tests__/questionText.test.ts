import { describe, expect, it } from "vitest";
import { displayPrompt } from "../questionText";

describe("displayPrompt", () => {
  it("drops a leading [Topic] prefix that matches the question's topic", () => {
    expect(displayPrompt("[Cells] What is a cell wall?", "Cells")).toBe("What is a cell wall?");
  });

  it("keeps prompts whose bracket is something else", () => {
    expect(displayPrompt("[Note] Read carefully.", "Cells")).toBe("[Note] Read carefully.");
    expect(displayPrompt("What is a cell?", "Cells")).toBe("What is a cell?");
  });

  it("drops any leading bracket when the topic isn't known", () => {
    expect(displayPrompt("[Cells] What is a cell wall?")).toBe("What is a cell wall?");
    expect(displayPrompt("What is a cell?")).toBe("What is a cell?");
  });
});
