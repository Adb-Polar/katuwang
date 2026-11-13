import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RegistrationApprovalTable from "../RegistrationApprovalTable";

const { state } = vi.hoisted(() => ({ state: { data: [] as unknown[] } }));
vi.mock("@/hooks/usePaginatedList", () => ({ usePaginatedList: () => ({ ...state, total: state.data.length, page: 1, pageSize: 20, loading: false }) }));

describe("registration review details", () => {
  it.each(["STUDENT_TUTOR", "STUDENT_LEARNER"])("shows school details and legacy fallback for %s before review controls", role => {
    const base = { anonymousId: "STU-0001", firstName: "Juan", lastName: "Cruz", email: "juan@example.test", role, gradeLevel: "GRADE_10", section: "Rizal", createdAt: "2026-11-09T00:00:00Z" };
    state.data = [{ ...base, id: "new", studentIdNumber: "001-234", adviserTeacherName: "Maria Santos" }, { ...base, id: "old", studentIdNumber: null, adviserTeacherName: null }];
    const html = renderToStaticMarkup(<RegistrationApprovalTable />);
    // Mobile cards and desktop rows both render the information.
    expect(html.match(/001-234/g)).toHaveLength(2);
    expect(html.match(/Maria Santos/g)).toHaveLength(2);
    expect(html.match(/Not provided/g)).toHaveLength(4);
    expect(html.indexOf("001-234")).toBeLessThan(html.indexOf(">Approve<"));
    expect(html).toContain(">Decline<");
  });
});
