import { describe, it, expect } from "vitest";
import { classDetailsSchema, createClassSchema, sessionSchema, addSessionSchema, updateSessionSchema } from "@/lib/validations/class";

const validSession = {
  topic: "Algebraic Expressions",
  scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
  duration: 60,
};

const validDetails = {
  subject: "MATH",
  topics: ["Algebraic Expressions"],
  maxStudents: 2,
};

describe("sessionSchema", () => {
  it("accepts a valid session", () => {
    expect(sessionSchema.safeParse(validSession).success).toBe(true);
  });

  it("rejects an empty topic", () => {
    expect(sessionSchema.safeParse({ ...validSession, topic: "" }).success).toBe(false);
  });

  it("rejects a non-ISO scheduledAt", () => {
    expect(sessionSchema.safeParse({ ...validSession, scheduledAt: "not-a-date" }).success).toBe(false);
  });

  it("rejects duration below 15 minutes", () => {
    expect(sessionSchema.safeParse({ ...validSession, duration: 10 }).success).toBe(false);
  });

  it("rejects duration above 240 minutes", () => {
    expect(sessionSchema.safeParse({ ...validSession, duration: 300 }).success).toBe(false);
  });
});

describe("classDetailsSchema", () => {
  it("accepts valid class details", () => {
    expect(classDetailsSchema.safeParse(validDetails).success).toBe(true);
  });

  it("rejects an empty topics array", () => {
    expect(classDetailsSchema.safeParse({ ...validDetails, topics: [] }).success).toBe(false);
  });

  it("rejects more than 10 topics", () => {
    const topics = Array.from({ length: 11 }, (_, i) => `Topic ${i}`);
    expect(classDetailsSchema.safeParse({ ...validDetails, topics }).success).toBe(false);
  });

  it("rejects maxStudents below 1", () => {
    expect(classDetailsSchema.safeParse({ ...validDetails, maxStudents: 0 }).success).toBe(false);
  });

  it("rejects maxStudents above 10", () => {
    expect(classDetailsSchema.safeParse({ ...validDetails, maxStudents: 11 }).success).toBe(false);
  });
});

describe("createClassSchema", () => {
  const withMeetingLink = { ...validDetails, meetingLink: "https://meet.google.com/abc-defg-hij" };

  it("accepts class details plus at least one session", () => {
    expect(createClassSchema.safeParse({ ...withMeetingLink, sessions: [validSession] }).success).toBe(true);
  });

  it("rejects zero sessions", () => {
    expect(createClassSchema.safeParse({ ...withMeetingLink, sessions: [] }).success).toBe(false);
  });

  it("rejects more than 20 sessions", () => {
    const sessions = Array.from({ length: 21 }, () => validSession);
    expect(createClassSchema.safeParse({ ...withMeetingLink, sessions }).success).toBe(false);
  });

  it("rejects when neither a location nor a meeting link is given", () => {
    expect(createClassSchema.safeParse({ ...validDetails, sessions: [validSession] }).success).toBe(false);
  });

  it("accepts a building/room location instead of a meeting link", () => {
    const withLocation = { ...validDetails, building: "Main Hall", sessions: [validSession] };
    expect(createClassSchema.safeParse(withLocation).success).toBe(true);
  });

  // Note: whether each session's topic actually belongs to the submitted `topics`
  // list is a DB-context-dependent business rule enforced in the route handler,
  // not something Zod can check here (Zod only validates shape, not cross-field
  // membership against the class's own topic list).
});

describe("addSessionSchema", () => {
  it("is the same shape as sessionSchema", () => {
    expect(addSessionSchema.safeParse(validSession).success).toBe(true);
  });
});

describe("updateSessionSchema", () => {
  it("accepts a partial update with just a status", () => {
    expect(updateSessionSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    expect(updateSessionSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    expect(updateSessionSchema.safeParse({ status: "NOT_A_STATUS" }).success).toBe(false);
  });

  it("still enforces duration bounds when duration is provided", () => {
    expect(updateSessionSchema.safeParse({ duration: 5 }).success).toBe(false);
  });
});
