"use client";

import FormField from "@/components/ui/FormField";
import { SCHOOL_TIME_ZONE_LABEL } from "@/lib/datetime";

/** Shared controls for adding and rescheduling a class session. */
export default function SessionFormFields({ topics, topic, date, time, duration, onTopic, onDate, onTime, onDuration }: {
  topics: string[];
  topic: string;
  date: string;
  time: string;
  duration: number;
  onTopic: (value: string) => void;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  onDuration: (value: number) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-base-300 bg-base-200/20 p-4 sm:p-5">
      <p className="text-sm text-base-content/60">Set the topic, start time, and length. Times are in {SCHOOL_TIME_ZONE_LABEL}.</p>
      <FormField label="Topic" required size="md">
        <select name="topic" value={topic} onChange={(e) => onTopic(e.target.value)} required className="select select-bordered w-full min-h-11 text-base sm:text-sm">
          <option value="" disabled>Select topic</option>
          {topics.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </FormField>
      <div data-validation-group className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date" required size="md">
          <input name="scheduledAt" type="date" value={date} onChange={(e) => onDate(e.target.value)} required className="input input-bordered w-full min-w-0 min-h-11 text-base sm:text-sm" />
        </FormField>
        <FormField label="Start time" required size="md">
          <input name="time" type="time" value={time} onChange={(e) => onTime(e.target.value)} required className="input input-bordered w-full min-w-0 min-h-11 text-base sm:text-sm" />
        </FormField>
      </div>
      <FormField label="Duration" required size="md">
        <select name="duration" value={duration} onChange={(e) => onDuration(Number(e.target.value))} required className="select select-bordered w-full min-h-11 text-base sm:text-sm">
          {[30, 45, 60, 90, 120].includes(duration) ? null : <option value={duration}>{duration}m</option>}
          <option value={30}>30m</option>
          <option value={45}>45m</option>
          <option value={60}>1hr</option>
          <option value={90}>1hr 30m</option>
          <option value={120}>2hr</option>
        </select>
      </FormField>
    </div>
  );
}
