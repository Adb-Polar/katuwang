import { z } from "zod";
import { GradeLevel } from "@prisma/client";
const gradeLevels = z.array(z.nativeEnum(GradeLevel)).max(6);

const name = z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long.");

// slug: uppercase snake, used as the stored `subject` value — immutable after creation.
const slug = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(40, "Slug is too long.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "Slug must be UPPER_SNAKE_CASE (letters, digits, underscores).");

export const createSubjectSchema = z.object({ name, slug, gradeLevels: gradeLevels.optional() });
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z
  .object({
    gradeLevels: gradeLevels.optional(),
    name: name.optional(),
    order: z.number().int().min(0).max(999).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.order !== undefined || v.active !== undefined || v.gradeLevels !== undefined, {
    message: "Nothing to update.",
  });
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

export const createTopicSchema = z.object({ name, gradeLevels: gradeLevels.optional() });
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z
  .object({
    gradeLevels: gradeLevels.optional(),
    name: name.optional(),
    order: z.number().int().min(0).max(999).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.order !== undefined || v.active !== undefined || v.gradeLevels !== undefined, {
    message: "Nothing to update.",
  });
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
