import { z } from "zod";

export const requestTopicCertificationSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
});

export type RequestTopicCertificationInput = z.infer<typeof requestTopicCertificationSchema>;
