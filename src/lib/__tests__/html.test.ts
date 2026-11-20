import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/html";

describe("escapeHtml", () => {
  it("escapes markup and quote characters", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jo'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jo&#39;&lt;/a&gt;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Maria Santos")).toBe("Maria Santos");
  });
});
