import { z } from "zod";
import { SubjectArea } from "@prisma/client";

export const requestTopicCertificationSchema = z.object({
  subject: z.nativeEnum(SubjectArea, {
    message: "Invalid subject area.",
  }),
  topic: z.string().trim().min(1, "Topic is required."),
});

export type RequestTopicCertificationInput = z.infer<typeof requestTopicCertificationSchema>;
