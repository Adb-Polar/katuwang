import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SessionTestsCard from "../SessionTestsCard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("SessionTestsCard", () => {
  it("offers the posted post-test before completion even when the learner missed the pre-test", () => {
    const html = renderToStaticMarkup(
      <SessionTestsCard
        classId="class-1"
        audience="learner"
        rows={[{
          sessionId: "session-1",
          topic: "Fractions",
          scheduledAt: new Date().toISOString(),
          sessionStatus: "SCHEDULED",
          test: { id: "test-1", title: "Check-in", status: "PUBLISHED", pretestClosedAt: new Date().toISOString(), posttestOpenedAt: new Date().toISOString() },
          pre: null,
          post: null,
        }]}
      />,
    );
    expect(html).toContain("Take post-test");
    expect(html).toContain("/learner/classes/class-1/sessions/session-1/test/post");
  });

  it("does not offer a new pre-test after its window closes", () => {
    const html = renderToStaticMarkup(
      <SessionTestsCard
        classId="class-1"
        audience="learner"
        rows={[{
          sessionId: "session-1",
          topic: "Fractions",
          scheduledAt: new Date().toISOString(),
          sessionStatus: "SCHEDULED",
          test: { id: "test-1", title: "Check-in", status: "PUBLISHED", pretestClosedAt: new Date().toISOString() },
          pre: null,
          post: null,
        }]}
      />,
    );
    expect(html).toContain("Pre-test closed");
    expect(html).not.toContain("Take pre-test");
  });

  it("shows a tutor action on a published test without an open post-test", () => {
    const html = renderToStaticMarkup(
      <SessionTestsCard
        classId="class-1"
        audience="tutor"
        rows={[{
          sessionId: "session-1",
          topic: "Fractions",
          scheduledAt: new Date().toISOString(),
          sessionStatus: "COMPLETED",
          test: { id: "test-1", title: "Check-in", status: "PUBLISHED", pretestClosedAt: null, posttestOpenedAt: null },
        }]}
      />,
    );
    expect(html).toContain("Publish post-test");
  });
});
