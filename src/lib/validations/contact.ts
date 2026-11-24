import { z } from "zod";

/** What the message is about — the form's dropdown and the stored `subject`. */
export const CONTACT_SUBJECTS = [
  "Account access",
  "Suspended or banned account",
  "Registration or approval",
  "Report a problem",
  "Other",
] as const;

export const CONTACT_MESSAGE_MAX = 2000;
export const CONTACT_NOTE_MAX = 1000;

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100, "Name cannot exceed 100 characters."),
  email: z.string().trim().toLowerCase().pipe(z.string().email("Enter a valid email address.")),
  subject: z.enum(CONTACT_SUBJECTS, { message: "Choose what your message is about." }),
  message: z
    .string()
    .trim()
    .min(10, "Please describe your concern in at least 10 characters.")
    .max(CONTACT_MESSAGE_MAX, `Message cannot exceed ${CONTACT_MESSAGE_MAX} characters.`),
  // Honeypot: hidden from people, so only a bot fills it in.
  website: z.string().max(0).optional(),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;

export const reviewContactMessageSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"], { message: "Invalid status." }),
  adminNote: z
    .string()
    .trim()
    .max(CONTACT_NOTE_MAX, `Note cannot exceed ${CONTACT_NOTE_MAX} characters.`)
    .optional()
    .or(z.literal("")),
});

export type ReviewContactMessageInput = z.infer<typeof reviewContactMessageSchema>;
