import { describe, expect, it } from "vitest";
import { loadQuestionBank, validateQuestionBank } from "../questionBankData";

const bank = loadQuestionBank();
function changed(edit: (copy: typeof bank) => void) { const copy = structuredClone(bank); edit(copy); return copy; }
describe("committed topic question bank", () => {
  it("covers all 292 canonical topics with 20 questions and four choices each", () => {
    expect(bank.questions).toHaveLength(5840);
    expect(new Set(bank.questions.map(q => q.subject)).size).toBe(47);
    expect(new Set(bank.questions.map(q => JSON.stringify([q.subject, q.topic]))).size).toBe(292);
    expect(bank.questions.reduce((n, q) => n + q.options.length, 0)).toBe(23360);
    expect(bank.reviewStatus).toBe("UNREVIEWED");
  });
  it("contains concrete subject knowledge and worked exercises rather than generic study advice", () => {
    const find = (subject: string, ref: string) => bank.questions.find(q => q.subject === subject && q.contentRef === ref)!;
    const nile = find("JHS_ARALING_PANLIPUNAN", "concept:ap_world_civilizations:03");
    expect(nile.prompt).toContain("Egypt");
    expect(nile.options.find(o => o.isCorrect)?.text).toBe("Nile");
    const rightTriangle = find("MATH", "calculation:geometry:03");
    expect(rightTriangle.prompt).toContain("hypotenuse");
    expect(rightTriangle.explanation).toContain("Pythagoras");
    expect(bank.questions.some(q => /central concept behind|standard workflow for solving complex tasks/.test(q.prompt))).toBe(false);
  });
  it.each([
    ["missing topic item", (b: typeof bank) => { b.questions.pop(); }],
    ["duplicate ID", (b: typeof bank) => { b.questions[1].id = b.questions[0].id; }],
    ["unknown topic", (b: typeof bank) => { b.questions[0].topic = "Invented topic"; }],
    ["incorrect grade", (b: typeof bank) => { b.questions[0].gradeLevels = ["GRADE_12"]; }],
    ["two correct answers", (b: typeof bank) => { b.questions[0].options.forEach(o => { o.isCorrect = true; }); }],
    ["duplicate choices", (b: typeof bank) => { b.questions[0].options[1].text = b.questions[0].options[0].text; }],
    ["blank explanation", (b: typeof bank) => { b.questions[0].explanation = " "; }],
    ["claimed approval", (b: typeof bank) => { (b as unknown as { reviewStatus: string }).reviewStatus = "APPROVED"; }],
    ["answer imbalance", (b: typeof bank) => { const q = b.questions[0]; const pos = q.options.findIndex(o => o.isCorrect); [q.options[pos], q.options[(pos + 1) % 4]] = [q.options[(pos + 1) % 4], q.options[pos]]; }],
  ])("rejects %s before database access", (_name, edit) => {
    expect(() => validateQuestionBank(changed(edit))).toThrow();
  });
});
