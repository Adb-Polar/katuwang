import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProfileView from "../ProfileView";

vi.mock("@/components/profile/RecoveryEmailSettings", () => ({ default: () => null }));
vi.mock("@/components/profile/AccountControls", () => ({ default: () => null }));
vi.mock("@/components/profile/UserAvatar", () => ({ default: () => null }));

const tutorProps: ComponentProps<typeof ProfileView> = {
  eyebrow: "Iyong account",
  idRole: "TUTOR",
  editHref: "/tutor/profile/edit",
  fullName: "Ana Cruz",
  email: "ana@school.test",
  anonymousId: "TUT-0001",
  section: "Rizal",
  contactInfo: "",
  certifiedTopics: [
    { subject: "MATHEMATICS", topic: "Fractions" },
    { subject: "MATHEMATICS", topic: "Ratios" },
    { subject: "SCIENCE", topic: "Cells" },
  ],
};

const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

describe("ProfileView (tutor)", () => {
  it("tells the tutor learners see only the ID while real names are hidden", () => {
    const html = text(renderToStaticMarkup(<ProfileView {...tutorProps} />));
    expect(html).toContain("Learners see you only as TUT-0001");
    expect(html).toContain("Only you and administrators can see your real name");
  });

  it("does not promise anonymity when the school shows tutors' real names", () => {
    const html = text(renderToStaticMarkup(<ProfileView {...tutorProps} learnersSeeRealName />));
    expect(html).toContain("Learners see your name and TUT-0001");
    expect(html).not.toContain("see you only as");
    expect(html).not.toContain("Only you and administrators can see your real name");
  });

  it("summarises certified topics in the section note and links to assessments", () => {
    const html = renderToStaticMarkup(<ProfileView {...tutorProps} />);
    expect(text(html)).toContain("3 topics in 2 subjects.");
    expect(html).toContain('href="/tutor/assessments"');
  });
});
