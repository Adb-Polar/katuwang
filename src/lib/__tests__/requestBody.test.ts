import { describe, it, expect } from "vitest";
import { readJsonBody } from "@/lib/requestBody";

const post = (body?: string) => new Request("http://localhost/x", { method: "POST", body });

describe("readJsonBody()", () => {
  it("parses a valid JSON body", async () => {
    expect(await readJsonBody(post('{"a":1}'))).toEqual({ a: 1 });
  });

  it("answers null for malformed JSON instead of throwing", async () => {
    expect(await readJsonBody(post("{bad"))).toBeNull();
  });

  it("answers null for an empty body", async () => {
    expect(await readJsonBody(post())).toBeNull();
  });
});
