import { z } from "zod";

/** `POST /api/admin/classes/[classId]/recommendations` — target learner + optional note. */
export const createClassRecommendationSchema = z.object({
  learnerId: z.string().min(1, "A learner is required."),
  note: z.string().trim().max(500, "Note cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type CreateClassRecommendationInput = z.infer<typeof createClassRecommendationSchema>;
