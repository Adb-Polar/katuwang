import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfilePictureRequirement } from "@/lib/settings";

export type PictureAction = "PUBLISH_CLASS" | "ACCEPT_REQUEST" | "ENROLL";
const ACTION_LABELS: Record<PictureAction, string> = {
  PUBLISH_CLASS: "publish a class", ACCEPT_REQUEST: "accept a tutoring request", ENROLL: "enroll in a class",
};

/** Shared action policy; profile access and withdrawal remain available. */
export async function profilePictureActionError(action: PictureAction, image: string | null | undefined, db: Prisma.TransactionClient = prisma): Promise<string | null> {
  const requirement = await getProfilePictureRequirement(db);
  const required = requirement === "ALL_USERS" || (requirement === "TUTORS_ONLY" && action !== "ENROLL");
  return required && !image?.trim()
    ? `A profile picture is required to ${ACTION_LABELS[action]}. Upload one in your profile settings.`
    : null;
}
