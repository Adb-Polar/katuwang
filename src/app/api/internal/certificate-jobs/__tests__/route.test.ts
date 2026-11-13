import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { processJobs } = vi.hoisted(() => ({ processJobs: vi.fn().mockResolvedValue({ processed: 0, sent: 0 }) }));
vi.mock("@/lib/certificates/jobs", () => ({ processCertificateJobs: processJobs }));
import { POST } from "../route";
const request = (authorization = "") => new NextRequest("http://localhost/api/internal/certificate-jobs", { method: "POST", headers: { authorization } });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("certificate scheduler authorization", () => {
  it("fails closed with no configured job secret", async () => {
    vi.stubEnv("CERTIFICATE_JOB_SECRET", ""); expect((await POST(request("Bearer undefined"))).status).toBe(401); expect(processJobs).not.toHaveBeenCalled();
  });
  it("rejects missing and incorrect secrets without running jobs", async () => {
    vi.stubEnv("CERTIFICATE_JOB_SECRET", "isolated-test-job-secret");
    expect((await POST(request())).status).toBe(401); expect((await POST(request("Bearer isolated-test-job-secrex"))).status).toBe(401); expect(processJobs).not.toHaveBeenCalled();
  });
  it("accepts a correctly authenticated scheduler request", async () => {
    vi.stubEnv("CERTIFICATE_JOB_SECRET", "isolated-test-job-secret");
    expect((await POST(request("Bearer isolated-test-job-secret"))).status).toBe(200); expect(processJobs).toHaveBeenCalledWith(10);
  });
});
