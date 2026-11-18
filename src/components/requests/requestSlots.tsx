/** A preferred time on a class request: a dated day ("2026-12-11") or a weekly day, with HH:MM times. */
export type Slot = { date?: string | null; day: string; startTime: string; endTime: string };

/** "15:00" → "3:00 PM". */
function clock(hhmm: string): { time: string; meridiem: string } {
  const [h, m] = hhmm.split(":").map(Number);
  return { time: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, meridiem: h < 12 ? "AM" : "PM" };
}

export function slotRange(slot: Slot): string {
  const a = clock(slot.startTime);
  const b = clock(slot.endTime);
  return a.meridiem === b.meridiem ? `${a.time}–${b.time} ${b.meridiem}` : `${a.time} ${a.meridiem}–${b.time} ${b.meridiem}`;
}

/** Calendar-style block for a request's first free time: a dated day, or "Every Fri" for a weekly time. */
export function SlotDate({ slot }: { slot?: Slot }) {
  const box = "w-14 shrink-0 flex flex-col items-center text-center";
  if (!slot) {
    return <div className={box}><span className="text-sm text-(--kt-muted) pt-1">Any time</span></div>;
  }
  if (!slot.date) {
    return (
      <div className={box} aria-hidden="true">
        <span className="text-sm text-(--kt-muted)">Every</span>
        <span className="font-serif text-2xl leading-tight">{slot.day[0]}{slot.day.slice(1, 3).toLowerCase()}</span>
      </div>
    );
  }
  const d = new Date(`${slot.date}T12:00:00+08:00`);
  const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", ...o });
  return (
    <div className={box} aria-hidden="true">
      <span className="text-sm text-(--kt-muted)">{part({ weekday: "short" })}</span>
      <span className="font-serif text-3xl leading-tight">{part({ day: "numeric" })}</span>
      <span className="text-sm text-(--kt-muted)">{part({ month: "short" })}</span>
    </div>
  );
}

/** A preferred slot as a learner would say it: "Fri, Dec 11 · 3:00–4:00 PM" or "Every Friday · 3:00–4:00 PM". */
export function slotLabel(slot: Slot): string {
  const day = slot.date
    ? new Date(`${slot.date}T12:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric" })
    : `Every ${slot.day[0]}${slot.day.slice(1).toLowerCase()}`;
  return `${day} · ${slotRange(slot)}`;
}

