import { z } from "zod";

const MAX_IDS = 200;

// `ids` omitted or empty = mark ALL of the caller's unread notifications.
export const markNotificationsReadSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, "Invalid notification id."), { message: "ids must be a list of notification ids." })
    .max(MAX_IDS, `Cannot mark more than ${MAX_IDS} notifications at once.`)
    .optional(),
});
