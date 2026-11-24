import { describe, it, expect } from "vitest";
import {
  domainNotAllowedMessage,
  emailDomain,
  isEmailDomainAllowed,
  isValidDomain,
  parseDomainList,
} from "@/lib/emailDomains";

const ALLOWED = ["gmail.com", "deped.gov.ph"];

describe("isValidDomain", () => {
  it.each(["gmail.com", "deped.gov.ph", "my-school.edu.ph", "a1.io"])("accepts %s", (domain) => {
    expect(isValidDomain(domain)).toBe(true);
  });

  it.each(["qwqe", "test.123", "", ".com", "exa mple.com", "-bad.com", "bad-.com", "a..com", "x.c"])(
    "rejects %s",
    (domain) => {
      expect(isValidDomain(domain)).toBe(false);
    }
  );
});

describe("parseDomainList", () => {
  it("splits on commas, spaces and newlines, strips @, lowercases and de-duplicates", () => {
    expect(parseDomainList("Gmail.com, @deped.gov.ph\n gmail.com  ")).toEqual(["gmail.com", "deped.gov.ph"]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseDomainList("  , ")).toEqual([]);
  });
});

describe("emailDomain", () => {
  it("takes the part after the last @, lowercased", () => {
    expect(emailDomain("Ana@GMAIL.com")).toBe("gmail.com");
    expect(emailDomain('"odd@local"@deped.gov.ph')).toBe("deped.gov.ph");
  });

  it("is empty when there is no @", () => {
    expect(emailDomain("not-an-email")).toBe("");
  });
});

describe("isEmailDomainAllowed", () => {
  it("accepts an address on the list", () => {
    expect(isEmailDomainAllowed("ana@gmail.com", ALLOWED)).toBe(true);
  });

  it.each(["asa@qwqe", "a@test.123", "ana@yahoo.com", "ana@notgmail.com", "ana@gmail.com.evil.io", "ana"])(
    "rejects %s",
    (email) => {
      expect(isEmailDomainAllowed(email, ALLOWED)).toBe(false);
    }
  );

  it("rejects everything when the list is empty", () => {
    expect(isEmailDomainAllowed("ana@gmail.com", [])).toBe(false);
  });
});

describe("domainNotAllowedMessage", () => {
  it("names the rejected domain and the accepted ones", () => {
    const message = domainNotAllowedMessage("asa@qwqe", ALLOWED);
    expect(message).toContain("@qwqe");
    expect(message).toContain("@gmail.com, @deped.gov.ph");
  });
});
