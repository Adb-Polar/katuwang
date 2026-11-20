import { describe, expect, it } from "vitest";
import { LOCATION_TEXT, PERSON_NAME, SECTION_NAME, STUDENT_ID } from "@/lib/validations/textRules";
import { registerSchema } from "@/lib/validations/auth";
import { updateProfileSchema } from "@/lib/validations/profile";
import { classDetailsSchema } from "@/lib/validations/class";
import { createAdminAccountSchema } from "@/lib/validations/admin";

const JUNK = ["<script>alert(1)</script>", "@@##$$", "Juan😀", "!!!"];

describe("text rules", () => {
  it.each([
    [PERSON_NAME, ["Juan", "Ma. Cristina", "O'Brien-Dela Cruz", "Peña", "José", "Ñoño"], [...JUNK, "12345", "Juan2", ".Juan", "-"]],
    [SECTION_NAME, ["Rizal", "7-A", "STEM 1", "Sampaguita"], [...JUNK, "<b>7-A</b>", "-A"]],
    [STUDENT_ID, ["123456789012", "2024-00123"], [...JUNK, "abc", "12a4", "-123"]],
    [LOCATION_TEXT, ["Bldg. 2", "Rm 101", "Annex B/3", "#4", "Science Lab"], [...JUNK, "<b>", "Room;DROP"]],
  ])("%#: accepts real values and rejects junk", (rule, good, bad) => {
    for (const value of good) expect(rule.regex.test(value), value).toBe(true);
    for (const value of bad) expect(rule.regex.test(value), value).toBe(false);
  });

  it("each client pattern compiles under the browser's v flag and matches the server regex", () => {
    for (const rule of [PERSON_NAME, SECTION_NAME, STUDENT_ID, LOCATION_TEXT]) {
      const browser = new RegExp(`^(?:${rule.pattern})$`, "v");
      for (const value of ["Juan", "7-A", "2024-001", "Bldg. 2/#3", "<x>", "@@"]) {
        expect(browser.test(value), `${rule.pattern} / ${value}`).toBe(rule.regex.test(value));
      }
    }
  });
});

describe("schemas apply the text rules", () => {
  const base = { type: "LEARNER", firstName: "Juan", lastName: "Cruz", email: "j@x.com", password: "Str0ng!Passw0rd#2026", gradeLevel: "GRADE_7", studentIdNumber: "123456789012", adviserTeacherName: "Ms. Santos", section: "Rizal", contactInfo: "", consentGiven: true };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ["firstName", "12345", "First name:"],
    ["lastName", "<script>", "Last name:"],
    ["adviserTeacherName", "<img src=x>", "Adviser Teacher's Name:"],
    ["studentIdNumber", "abc!@#", "Student ID Number:"],
    ["section", "!!!@@@", "Section:"],
  ])("register rejects %s = %j", (field, value, prefix) => {
    const result = registerSchema.safeParse({ ...base, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual([field]);
    expect(result.error!.issues[0].message).toContain(prefix);
  });

  it("trims before checking, so surrounding spaces are fine", () => {
    const result = registerSchema.safeParse({ ...base, firstName: "  Juan  " });
    expect(result.success && result.data.firstName).toBe("Juan");
  });

  it("profile section uses the section rule", () => {
    expect(updateProfileSchema.safeParse({ section: "7-A" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ section: "<x>" }).success).toBe(false);
  });

  it("class building/room use the location rule but stay optional", () => {
    const cls = { subject: "MATH", topics: ["Algebra"], maxStudents: 3 };
    expect(classDetailsSchema.safeParse({ ...cls, building: "Bldg. 2", room: "Rm 101" }).success).toBe(true);
    expect(classDetailsSchema.safeParse({ ...cls, building: "", room: "" }).success).toBe(true);
    expect(classDetailsSchema.safeParse({ ...cls, building: "<script>" }).success).toBe(false);
    expect(classDetailsSchema.safeParse({ ...cls, room: "@@@" }).success).toBe(false);
  });

  it("admin names use the person-name rule", () => {
    expect(createAdminAccountSchema.safeParse({ firstName: "Maria", lastName: "Santos", email: "a@b.com" }).success).toBe(true);
    expect(createAdminAccountSchema.safeParse({ firstName: "123", lastName: "Santos", email: "a@b.com" }).success).toBe(false);
  });
});
