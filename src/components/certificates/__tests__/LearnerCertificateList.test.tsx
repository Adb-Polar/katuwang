// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const list = vi.hoisted(() => ({ state: {} as Record<string, unknown> }));
vi.mock("@/hooks/usePaginatedList", () => ({ usePaginatedList: () => list.state }));
import LearnerCertificateList from "../LearnerCertificateList";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => vi.clearAllMocks());

const cert = (over: Record<string, unknown> = {}) => ({
  id: "c1", certificateNumber: "KTW-ABC123", tutorName: "TUT-0148", subjectName: "Mathematics",
  classCode: "MATH-7A", completedAt: "2026-11-05T16:30:00Z", pdfReady: true, ...over,
});

function render(data: unknown[], total = data.length) {
  list.state = { data, total, page: 1, pageSize: 20, setPage: vi.fn(), setPageSize: vi.fn(), loading: false, loadError: "", refetch: vi.fn() };
  const host = document.createElement("div");
  act(() => createRoot(host).render(<LearnerCertificateList />));
  return host;
}

describe("LearnerCertificateList", () => {
  it("shows the completion date in Manila time, the certificate number and a download link", () => {
    const host = render([cert()]);
    // 16:30Z on Nov 5 is Nov 6 in Asia/Manila.
    expect(host.querySelector("time")?.textContent).toContain("Completed Nov 6, 2026");
    expect(host.textContent).toContain("KTW-ABC123");
    expect(host.querySelector("a[download]")?.getAttribute("href")).toBe("/api/certificates/c1/download");
    expect(host.textContent).not.toMatch(/Details|Refresh|provider/);
  });

  it("explains a PDF that is not ready instead of offering a download", () => {
    const host = render([cert({ pdfReady: false })]);
    expect(host.querySelector("a[download]")).toBeNull();
    expect(host.textContent).toContain("still being made");
  });

  it("points an empty list at My classes", () => {
    const host = render([]);
    expect(host.querySelector('a[href="/learner/my-classes"]')?.textContent).toBe("See my classes");
  });

  it("hides pagination when everything fits on one page", () => {
    expect(render([cert()]).textContent).not.toMatch(/Page 1 of/);
    expect(render([cert()], 45).textContent).toMatch(/Page 1 of 3/);
  });
});
