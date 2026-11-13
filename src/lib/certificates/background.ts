import { after } from "next/server";
import { processCertificateJobs } from "./jobs";
/** Durable rows exist before this best-effort fast path; the worker recovers missed/failed work. */
export function scheduleCertificateJobs(classId?: string) {
  after(async () => {
    try { await processCertificateJobs(10, classId); }
    catch { console.error("[certificates] Background processing interrupted; jobs remain available to the worker."); }
  });
}
