"use client";

import {
  busySlotsOn,
  formatDuration,
  formatTimeRange,
  resolveSessionTime,
  toLocalDateInput,
  type BusySlot,
  type SessionTimeValue,
} from "@/lib/sessionTime";

/**
 * Date + start time + end time for one session, with the derived duration, the
 * tutor's other bookings on that day, and an inline error — so a bad slot is
 * visible while picking it instead of after submitting.
 */
export default function SessionTimeFields({
  value,
  onChange,
  error,
  busy,
  inputClassName = "input-sm text-xs",
}: {
  value: SessionTimeValue;
  onChange: (value: SessionTimeValue) => void;
  /** From `sessionTimeError`; rendered under the inputs. */
  error: string | null;
  /** The tutor's other booked sessions; those on the chosen date are listed. */
  busy: BusySlot[];
  inputClassName?: string;
}) {
  const resolved = resolveSessionTime(value);
  const bookedThatDay = value.date ? busySlotsOn(value.date, busy) : [];
  const inputCls = `input input-bordered ${inputClassName} w-full ${error ? "input-error" : ""}`;
  const set = (field: keyof SessionTimeValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <label className="col-span-2 sm:col-span-1 flex flex-col gap-0.5">
          <span className="text-2xs font-semibold text-base-content/60">Date</span>
          <input
            type="date"
            value={value.date}
            min={toLocalDateInput(new Date())}
            onChange={set("date")}
            required
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold text-base-content/60">Start time</span>
          <input type="time" value={value.startTime} onChange={set("startTime")} required className={inputCls} />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold text-base-content/60">End time</span>
          <input
            type="time"
            value={value.endTime}
            min={value.startTime || undefined}
            onChange={set("endTime")}
            required
            className={inputCls}
          />
        </label>
      </div>

      {error ? (
        <p className="text-2xs text-error" role="alert">
          {error}
        </p>
      ) : (
        resolved && (
          <p className="text-2xs text-base-content/60">
            Duration: <span className="font-mono font-semibold text-base-content">{formatDuration(resolved.duration)}</span>
          </p>
        )
      )}

      {bookedThatDay.length > 0 && (
        <p className="text-2xs text-base-content/60">
          Already booked that day:{" "}
          {bookedThatDay.map((slot, i) => (
            <span key={slot.id}>
              {i > 0 && ", "}
              <span className="font-mono">{formatTimeRange(slot)}</span> ({slot.classCode})
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
