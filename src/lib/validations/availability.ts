import { z } from "zod";

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
    day: dayEnum,
    startTime: timeString,
    endTime: timeString,
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "Start time must be before end time.",
    path: ["endTime"],
  });

export const updateAvailabilitySchema = z
  .object({
    slots: z
      .array(availabilitySlotSchema)
      .max(50, "You can define up to 50 availability slots."),
  })
  .refine(
    (data) => {
      const byDay = new Map<string, { startTime: string; endTime: string }[]>();
      for (const slot of data.slots) {
        const existing = byDay.get(slot.day) ?? [];
        existing.push(slot);
        byDay.set(slot.day, existing);
      }

      for (const slots of byDay.values()) {
        const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].startTime < sorted[i - 1].endTime) {
            return false;
          }
        }
      }

      return true;
    },
    { message: "Availability slots on the same day cannot overlap." }
  );

export type DayOfWeek = z.infer<typeof dayEnum>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
