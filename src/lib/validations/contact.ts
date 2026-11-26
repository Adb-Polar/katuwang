import { z } from "zod";
import { personNameField } from "@/lib/validations/personNameField";

export const CONTACT_MESSAGE_MIN = 20;
export const CONTACT_MESSAGE_MAX = 2000;

export const CONTACT_CATEGORIES = [
  { value: "ACCOUNT_ACCESS", label: "I can't sign in to my account" },
  { value: "SUSPENSION_OR_BAN", label: "My account was suspended or banned" },
  { value: "REGISTRATION", label: "My registration (pending, declined or unverified)" },
  { value: "OTHER", label: "Something else" },
] as const;

export type ContactCategoryValue = (typeof CONTACT_CATEGORIES)[number]["value"];

const CATEGORY_VALUES = CONTACT_CATEGORIES.map((c) => c.value) as [ContactCategoryValue, ...ContactCategoryValue[]];

export function contactCategoryLabel(value: string): string {
  return CONTACT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** `POST /api/contact` — anyone may write in, signed in or not. */
export const contactMessageSchema = z.object({
  name: personNameField("Name", 100),
  // The reply address. The sign-up domain allowlist does not apply: someone locked out
  // of a school account must still be able to reach an administrator.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.").max(191, "Email cannot exceed 191 characters.")),
  category: z.enum(CATEGORY_VALUES, { message: "Choose what your message is about." }),
  message: z
    .string()
    .trim()
    .min(CONTACT_MESSAGE_MIN, `Describe the problem in at least ${CONTACT_MESSAGE_MIN} characters.`)
    .max(CONTACT_MESSAGE_MAX, `Message cannot exceed ${CONTACT_MESSAGE_MAX} characters.`),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

/** `PATCH /api/admin/contact-messages/[messageId]` */
export const updateContactMessageSchema = z.object({
  status: z.enum(["OPEN", "HANDLED"], { message: "Invalid status." }),
});
