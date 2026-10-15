import { describe, it, expect } from "vitest";
import { getDatabaseUrl } from "@/lib/prisma";

describe("getDatabaseUrl", () => {
  it("returns empty string if no database URL is provided", () => {
    expect(getDatabaseUrl("")).toBe("");
  });

  it("normalizes an Aiven MySQL URL with ssl-mode=REQUIRED to include ssl=true and allowPublicKeyRetrieval=true", () => {
    const aivenUrl = "mysql://avnadmin:SECRET@katuwangdb-bicol-ace1.l.aivencloud.com:24446/defaultdb?ssl-mode=REQUIRED&connectTimeout=10000";
    const result = getDatabaseUrl(aivenUrl);
    const parsed = new URL(result);

    expect(parsed.searchParams.get("ssl")).toBe("true");
    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
    expect(parsed.searchParams.get("ssl-mode")).toBe("REQUIRED");
    expect(parsed.searchParams.get("connectTimeout")).toBe("10000");
  });

  it("preserves explicit ssl and allowPublicKeyRetrieval parameters if already configured", () => {
    const customUrl = "mysql://avnadmin:SECRET@katuwangdb-bicol-ace1.l.aivencloud.com:24446/defaultdb?ssl=true&allowPublicKeyRetrieval=true&connectTimeout=5000";
    const result = getDatabaseUrl(customUrl);
    const parsed = new URL(result);

    expect(parsed.searchParams.get("ssl")).toBe("true");
    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
    expect(parsed.searchParams.get("connectTimeout")).toBe("5000");
  });

  it("automatically configures allowPublicKeyRetrieval for localhost without forcing ssl", () => {
    const localUrl = "mysql://root:@127.0.0.1:3306/katuwang_db";
    const result = getDatabaseUrl(localUrl);
    const parsed = new URL(result);

    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
    expect(parsed.searchParams.get("ssl")).toBeNull();
  });

  it("enables TLS for remote cloud hosts even if ssl-mode query param is absent", () => {
    const remoteUrl = "mysql://avnadmin:SECRET@katuwangdb-bicol-ace1.l.aivencloud.com:24446/defaultdb";
    const result = getDatabaseUrl(remoteUrl);
    const parsed = new URL(result);

    expect(parsed.searchParams.get("ssl")).toBe("true");
    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
  });
});
