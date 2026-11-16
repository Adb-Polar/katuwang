import { describe, expect, it } from "vitest";
import { formatAuditReason } from "../auditLogDisplay";

describe("formatAuditReason", () => {
  it("summarizes catalog replacements without internal metadata", () => {
    const reason = JSON.stringify({
      operationId: "internal-operation", backupSha256: "internal-backup",
      previousTopic: "Welding", previousStatus: "CERTIFIED",
      replacements: [{ id: "internal-id", topic: "Shielded Metal Arc Welding", status: "CERTIFIED" }],
      reassessmentRequired: false,
    });
    expect(formatAuditReason(reason)).toBe(
      "Welding → Shielded Metal Arc Welding. Certified status retained."
    );
  });

  it("explains archived topics and reassessment", () => {
    expect(formatAuditReason(JSON.stringify({
      previousTopic: "Scientific Method & Inquiry", replacements: [], reassessmentRequired: true,
    }))).toBe("Scientific Method & Inquiry archived without a replacement. Reassessment required.");
  });

  it("does not imply that a previously rejected certification was retained", () => {
    expect(formatAuditReason(JSON.stringify({
      previousTopic: "Old topic", previousStatus: "REJECTED",
      replacements: [{ topic: "New topic", status: "CERTIFIED" }],
    }))).toBe("Old topic → New topic. Certified.");
  });

  it("keeps ordinary reasons including bracketed prose", () => {
    expect(formatAuditReason(" Reviewed [by admin] ")).toBe("Reviewed [by admin]");
    expect(formatAuditReason(null)).toBeNull();
    expect(formatAuditReason(" ")).toBeNull();
  });

  it("extracts human reasons from metadata", () => {
    expect(formatAuditReason('{"reason":"Duplicate topic","operationId":"secret"}'))
      .toBe("Duplicate topic");
  });

  it("hides unknown, nested and malformed metadata", () => {
    for (const reason of ['{"backupSha256":"secret"}', '[{"id":"secret"}]', '{"reason":', '{"reason":"{\\"id\\":\\"secret\\"}"}']) {
      expect(formatAuditReason(reason)).toBe("Update recorded.");
    }
  });

  it("keeps subject and topic context from older prefixed entries", () => {
    expect(formatAuditReason('SCIENCE · Biology -> {"active":false}')).toBe("SCIENCE · Biology");
  });
});
