/** Fixed database taxonomy for route tests; validation uses the real subjects module. */
const createdAt = new Date("2026-01-01T00:00:00.000Z");
export const catalogFixture = [{
  id: "subject-math", slug: "MATH", name: "Mathematics", order: 0, active: true,
  gradeLevels: ["GRADE_9"], curriculum: "K12", createdAt, updatedAt: createdAt,
  topics: [{
    id: "topic-quadratic", subjectId: "subject-math", name: "Quadratic Equations",
    order: 0, active: true, gradeLevels: ["GRADE_9"], curriculum: "K12", createdAt,
  }],
}];
