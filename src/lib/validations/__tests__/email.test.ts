import { describe, expect, it } from "vitest";
import { commonRegisterSchema } from "@/lib/validations/auth";
import {
  EMAIL_INPUT_PATTERN,
  allowedEmailDomainsSchema,
  emailDomainNotAllowedMessage,
  isEmailDomainAllowed,
  isValidEmailDomain,
  parseAllowedEmailDomains,
} from "@/lib/validations/email";

describe("email format", () => {
  const emailIssue = (email: string) => commonRegisterSchema.shape.email.safeParse(email).error?.issues[0];

  it.each(["user@test.123", "asa@qwqe", "@test.123", "user@", "user@.com", "user@school..ph"])(
    "rejects the malformed address %s",
    (email) => {
      expect(emailIssue(email)?.message).toBe("Invalid email address.");
    }
  );

  it.each(["juan@school.edu.ph", "maria.santos@katuwang.test", "a+b@gmail.com"])("accepts %s", (email) => {
    expect(emailIssue(email)).toBeUndefined();
  });

  it("gives the browser the same rule through the input pattern", () => {
    const pattern = new RegExp(`^(?:${EMAIL_INPUT_PATTERN})$`);
    expect(pattern.test("asa@qwqe")).toBe(false);
    expect(pattern.test("user@test.123")).toBe(false);
    expect(pattern.test("juan@school.edu.ph")).toBe(true);
  });
});

describe("allowed email domains", () => {
  it("parses commas, spaces, new lines, a leading @ and mixed case", () => {
    expect(parseAllowedEmailDomains(" @School.edu.ph, gmail.com\nDepEd.gov.ph ")).toEqual([
      "school.edu.ph",
      "gmail.com",
      "deped.gov.ph",
    ]);
  });

  it("drops duplicates and empty entries", () => {
    expect(parseAllowedEmailDomains("gmail.com,, gmail.com ,")).toEqual(["gmail.com"]);
    expect(parseAllowedEmailDomains(null)).toEqual([]);
  });

  it("allows every domain when the list is empty", () => {
    expect(isEmailDomainAllowed("anyone@anywhere.org", [])).toBe(true);
  });

  it("allows only listed domains once the list has entries", () => {
    const allowed = ["school.edu.ph"];
    expect(isEmailDomainAllowed("juan@school.edu.ph", allowed)).toBe(true);
    expect(isEmailDomainAllowed("juan@gmail.com", allowed)).toBe(false);
  });

  it("does not treat a subdomain or a look-alike as the listed domain", () => {
    const allowed = ["school.edu.ph"];
    expect(isEmailDomainAllowed("juan@mail.school.edu.ph", allowed)).toBe(false);
    expect(isEmailDomainAllowed("juan@notschool.edu.ph", allowed)).toBe(false);
    expect(isEmailDomainAllowed("school.edu.ph@evil.com", allowed)).toBe(false);
  });

  it("names the approved domains in the rejection message", () => {
    expect(emailDomainNotAllowedMessage(["school.edu.ph", "gmail.com"])).toBe(
      "Use an email address from an approved domain: @school.edu.ph, @gmail.com."
    );
  });

  it.each(["test.123", "qwqe", "-bad.com", "bad-.com", "a..b.com", "http://x.com"])("rejects the domain %s", (domain) => {
    expect(isValidEmailDomain(domain)).toBe(false);
    expect(allowedEmailDomainsSchema.safeParse(domain).success).toBe(false);
  });

  it("normalizes a valid list and accepts an empty one", () => {
    expect(allowedEmailDomainsSchema.parse("Gmail.com, @school.edu.ph")).toEqual(["gmail.com", "school.edu.ph"]);
    expect(allowedEmailDomainsSchema.parse("")).toEqual([]);
  });
});
