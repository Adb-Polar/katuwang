import { z } from "zod";

export const chatbotMessageSchema = z.object({
  message: z
    .string({ message: "Message is required." })
    .trim()
    .min(1, "Type a message first.")
    .max(500, "Message cannot exceed 500 characters."),
});

export type ChatbotMessageInput = z.infer<typeof chatbotMessageSchema>;
