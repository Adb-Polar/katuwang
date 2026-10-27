import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import { getCaCertificate, getDatabaseConfig, getDatabaseUrl } from "@/lib/prisma";

describe("getCaCertificate", () => {
  it("returns undefined when no certificate environment variable or file is present", () => {
    const cert = getCaCertificate({});
    expect(cert).toBeUndefined();
  });

  it("extracts certificate from AIVEN_CA_CERT and normalizes escaped newlines", () => {
    const mockPem = "-----BEGIN CERTIFICATE-----\\nMIIDSample...\\n-----END CERTIFICATE-----";
    const cert = getCaCertificate({ AIVEN_CA_CERT: mockPem });

    expect(cert).toBe("-----BEGIN CERTIFICATE-----\nMIIDSample...\n-----END CERTIFICATE-----");
  });

  it("extracts certificate from fallback DATABASE_CA_CERT", () => {
    const mockPem = "-----BEGIN CERTIFICATE-----\nMIIDDatabaseCert...\n-----END CERTIFICATE-----";
    const cert = getCaCertificate({ DATABASE_CA_CERT: mockPem });

    expect(cert).toBe(mockPem);
  });

  it("reads certificate from file path provided in AIVEN_CA_CERT_PATH", () => {
    const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValue("-----BEGIN CERTIFICATE-----\nFromFile\n-----END CERTIFICATE-----");

    const cert = getCaCertificate({ AIVEN_CA_CERT_PATH: "/etc/secrets/aiven-ca.pem" });

    expect(existsSpy).toHaveBeenCalledWith("/etc/secrets/aiven-ca.pem");
    expect(readSpy).toHaveBeenCalledWith("/etc/secrets/aiven-ca.pem", "utf8");
    expect(cert).toBe("-----BEGIN CERTIFICATE-----\nFromFile\n-----END CERTIFICATE-----");

    existsSpy.mockRestore();
    readSpy.mockRestore();
  });
});

describe("getDatabaseConfig", () => {
  const aivenUrl = "mysql://avnadmin:SECRET_PASS@katuwangdb-bicol-ace1.l.aivencloud.com:24446/defaultdb?ssl-mode=REQUIRED&connectTimeout=10000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("injects trusted CA certificate and enforces rejectUnauthorized: true when CA cert is provided", () => {
    const mockCert = "-----BEGIN CERTIFICATE-----\nMockCert\n-----END CERTIFICATE-----";
    const config = getDatabaseConfig(aivenUrl, { AIVEN_CA_CERT: mockCert });

    expect(typeof config).toBe("object");
    if (typeof config === "object") {
      expect(config.host).toBe("katuwangdb-bicol-ace1.l.aivencloud.com");
      expect(config.port).toBe(24446);
      expect(config.user).toBe("avnadmin");
      expect(config.password).toBe("SECRET_PASS");
      expect(config.database).toBe("defaultdb");
      expect(config.allowPublicKeyRetrieval).toBe(true);
      expect(config.connectTimeout).toBe(10000);
      expect(config.ssl).toEqual({
        ca: mockCert,
        rejectUnauthorized: true,
      });
    }
  });

  it("enforces rejectUnauthorized: true and warns when Aiven CA is missing in production", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = getDatabaseConfig(aivenUrl, { NODE_ENV: "production" });

    expect(typeof config).toBe("object");
    if (typeof config === "object") {
      expect(config.ssl).toEqual({
        rejectUnauthorized: true,
      });
      // Verification: rejectUnauthorized must not be bypassed
      expect((config.ssl as { rejectUnauthorized?: boolean }).rejectUnauthorized).toBe(true);
    }

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Aiven CA certificate not found in environment variables")
    );
    // Security check: ensure sensitive credentials are not logged in the warning
    const loggedMessage = warnSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).not.toContain("SECRET_PASS");
    expect(loggedMessage).not.toContain("avnadmin");
  });

  it("does not force SSL for local development databases", () => {
    const localUrl = "mysql://root:@127.0.0.1:3306/katuwang_db";
    const config = getDatabaseConfig(localUrl, { NODE_ENV: "development" });

    expect(typeof config).toBe("string");
    const parsed = new URL(config as string);
    expect(parsed.searchParams.get("ssl")).toBeNull();
    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
  });

  it("does not force SSL for local development databases even when AIVEN_CA_CERT is configured", () => {
    const localUrl = "mysql://root:@localhost:3306/katuwang_db";
    const config = getDatabaseConfig(localUrl, {
      NODE_ENV: "development",
      AIVEN_CA_CERT: "-----BEGIN CERTIFICATE-----\nMockCert\n-----END CERTIFICATE-----",
    });

    expect(typeof config).toBe("string");
    const parsed = new URL(config as string);
    expect(parsed.searchParams.get("ssl")).toBeNull();
    expect(parsed.searchParams.get("allowPublicKeyRetrieval")).toBe("true");
  });
});

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
});
