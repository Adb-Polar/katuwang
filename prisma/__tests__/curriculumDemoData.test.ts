import { describe, expect, it } from "vitest";
import { curriculumDemoRecipe, isSeedEmail } from "../curriculumDemoData";

describe("canonical connected seed recipe", () => {
  it("covers every current topic and compatible grade using only real topic questions", () => {
    const recipe = curriculumDemoRecipe();
    expect(recipe).toHaveLength(408);
    expect(new Set(recipe.map(r => r.subject)).size).toBe(47);
    expect(new Set(recipe.map(r => JSON.stringify([r.subject, r.topic]))).size).toBe(292);
    expect(new Set(recipe.map(r => r.classId)).size).toBe(408);
    for (const r of recipe) {
      expect(r.questions).toHaveLength(20);
      expect(r.questions.every(q => q.subject === r.subject && q.topic === r.topic && q.gradeLevels.includes(r.gradeLevel))).toBe(true);
    }
  });
  it("recognizes known seed identities without treating arbitrary test accounts as seeded", () => {
    for (const email of ["maria.santos@katuwang.test", "demo@tutor.test", "gen.tutor.001@seed.katuwang.test", "curriculum.learner.grade-7@seed.katuwang.test"]) expect(isSeedEmail(email)).toBe(true);
    for (const email of ["real@example.com", "someone@katuwang.test", "gen.tutor.1@seed.katuwang.test", "gen.tutor.001@seed.katuwang.test.attacker", "curriculum.tutor.grade-13@seed.katuwang.test"]) expect(isSeedEmail(email)).toBe(false);
  });
});
