/** Calendar values for the school timetable, independent of the server timezone. */
export const SCHEDULE_TIME_ZONE = "Asia/Manila";
export function scheduleDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: SCHEDULE_TIME_ZONE });
}
export function scheduleTime(value: Date | string): string {
  return new Date(value).toLocaleTimeString("en-PH", {
    timeZone: SCHEDULE_TIME_ZONE, hour: "2-digit", minute: "2-digit",
  });
}
export function timetableDays(now: Date) {
  const start = new Date(`${scheduleDate(now)}T12:00:00+08:00`);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start.getTime() + offset * 86400000);
    return {
      date: scheduleDate(date),
      day: date.toLocaleDateString("en-PH", { timeZone: SCHEDULE_TIME_ZONE, weekday: "short" }),
      label: date.toLocaleDateString("en-PH", { timeZone: SCHEDULE_TIME_ZONE, month: "short", day: "numeric" }),
    };
  });
}

/** Weekday and wall-clock minutes for schedule comparisons and tutor availability. */
export function scheduleClock(value: Date | string): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHEDULE_TIME_ZONE, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return { day: part("weekday").toUpperCase(), minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}
