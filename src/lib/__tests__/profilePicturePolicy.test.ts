import { describe, expect, it, vi } from "vitest";
import type { ProfilePictureRequirement } from "@/lib/settings";
import { profilePictureActionError, type PictureAction } from "@/lib/profilePicturePolicy";
const mocks = vi.hoisted(() => ({ requirement: vi.fn() }));
vi.mock("@/lib/settings", () => ({ getProfilePictureRequirement: mocks.requirement }));
describe("picture action prerequisites", () => {
  const actions: PictureAction[] = ["PUBLISH_CLASS", "ACCEPT_REQUEST", "ENROLL"];
  const modes: ProfilePictureRequirement[] = ["OPTIONAL", "TUTORS_ONLY", "ALL_USERS"];
  it.each(modes.flatMap(mode => actions.map(action => [mode, action] as const)))("enforces %s for %s", async (mode, action) => {
    mocks.requirement.mockResolvedValue(mode);
    const required = mode === "ALL_USERS" || (mode === "TUTORS_ONLY" && action !== "ENROLL");
    expect(Boolean(await profilePictureActionError(action, null))).toBe(required);
    expect(Boolean(await profilePictureActionError(action, "  "))).toBe(required);
    expect(await profilePictureActionError(action, "https://example.test/avatar.webp")).toBeNull();
  });
});
