"use client";

import { useState } from "react";
import FormField from "@/components/ui/FormField";
import { SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";
import { useBusySessions } from "@/hooks/useBusySessions";
import {
  addMinutesToTime,
  formatSessionLength,
  scheduleProblem,
  sessionLengthError,
  sessionMinutes,
  todayInSchoolZone,
} from "@/lib/sessionTimes";

const INPUT_CLASS = "input input-bordered w-full min-w-0 min-h-11 text-base sm:text-sm";

/** Shared controls for adding and rescheduling a class session. */
export default function SessionFormFields({ topics, topic, date, time, duration, onTopic, onDate, onTime, onDuration, excludeSessionId }: {
  topics: string[];
  topic: string;
  date: string;
  time: string;
  duration: number;
  onTopic: (value: string) => void;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  onDuration: (value: number) => void;
  /** The session being rescheduled, so it is not reported as clashing with itself. */
  excludeSessionId?: string;
}) {
  const busySessions = useBusySessions();
  const [now] = useState(() => new Date());
  // Only set while the typed end time is not a valid session length; otherwise the end
  // time is derived from the start time and the duration the parent holds.
  const [endDraft, setEndDraft] = useState<string | null>(null);

  const endTime = endDraft ?? addMinutesToTime(time, duration);
  const lengthError = endDraft === null ? "" : sessionLengthError(time, endDraft);
  const problem =
    lengthError ||
    scheduleProblem({ date, time, duration }, busySessions.filter((s) => s.id !== excludeSessionId), now);

  const applyEnd = (start: string, end: string) => {
    const minutes = sessionMinutes(start, end);
    if (minutes !== null && !sessionLengthError(start, end)) {
      setEndDraft(null);
      onDuration(minutes);
    } else {
      setEndDraft(end);
    }
  };

  const changeStart = (value: string) => {
    if (endDraft !== null) applyEnd(value, endDraft);
    onTime(value);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--kt-muted)">Set the topic, date, and start and end time. Times are in {SCHOOL_TIME_ZONE_LABEL}.</p>
      <FormField label="Topic" required size="md">
        <select name="topic" value={topic} onChange={(e) => onTopic(e.target.value)} required className="select select-bordered w-full min-h-11 text-base sm:text-sm">
          <option value="" disabled>Select topic</option>
          {topics.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </FormField>
      <div data-validation-group className="grid gap-4 sm:grid-cols-3">
        <FormField label="Date" required size="md">
          <input name="scheduledAt" type="date" min={todayInSchoolZone(now)} value={date} onChange={(e) => onDate(e.target.value)} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="Start time" required size="md">
          <input name="time" type="time" value={time} onChange={(e) => changeStart(e.target.value)} required className={INPUT_CLASS} />
        </FormField>
        <FormField label="End time" required size="md">
          <input name="endTime" type="time" value={endTime} onChange={(e) => applyEnd(time, e.target.value)} disabled={!time} required className={INPUT_CLASS} />
        </FormField>
      </div>
      {time && !lengthError && (
        <p data-session-length className="text-sm text-(--kt-muted)">
          Length: {formatSessionLength(duration)}
          {endTime <= time ? " (ends the next day)" : ""}
        </p>
      )}
      {problem && (
        <p data-blocking-error role="status" className="text-[0.85rem] text-error">
          {problem}
        </p>
      )}
    </div>
  );
}
