import { z } from "zod";

// Shared weekly time-slot shape. Tutor availability is no longer hand-entered
// (it's auto-derived from class sessions — see `src/lib/derivedAvailability.ts`),
// but this slot schema is still the canonical shape for a learner's preferred
// meeting windows in the matcher (`src/lib/validations/match.ts`).

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const dayEnum = z.enum(DAYS, { message: "Invalid day of week." });

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM).");

export const availabilitySlotSchema = z
  .object({
    date: z.iso.date().nullable().optional(),
    day: dayEnum,
    startTime: timeString,
    endTime: timeString,
  })
  .refine((slot) => !slot.date || DAYS[(new Date(`${slot.date}T12:00:00Z`).getUTCDay() + 6) % 7] === slot.day, {
    message: "Date must match the selected day.", path: ["date"],
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "Start time must be before end time.",
    path: ["endTime"],
  });

export type DayOfWeek = z.infer<typeof dayEnum>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
