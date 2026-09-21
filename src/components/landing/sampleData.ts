import { addDays } from "@/lib/datetime";

export const SAMPLE_SUBJECT = "MATH";
export const SAMPLE_TOPIC = "Linear Equations & Inequalities";
export const SAMPLE_TUTOR_ID = "TUT-0148";
export const SAMPLE_CLASS_CODE = "C-0007";

// Hard-coded copies of what the app's subject/grade pickers show — the landing page never fetches these.
export const SAMPLE_SUBJECTS = ["MATH", "ENGLISH", "SCIENCE", "FILIPINO", "ARALING_PANLIPUNAN", "TLE", "MAPEH"];

export const SAMPLE_GRADES = [
  { value: "GRADE_7", label: "Grade 7" },
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

export const SAMPLE_TOPIC_CHOICES = [
  "Fractions & Decimals",
  "Algebraic Expressions",
  SAMPLE_TOPIC,
  "Geometry & Measurement",
];

/** A session `daysFromNow` days out at `hour`:00 local time, so sample classes always look upcoming. */
function upcomingSession(daysFromNow: number, hour: number): string {
  const at = addDays(new Date(), daysFromNow);
  at.setHours(hour, 0, 0, 0);
  return at.toISOString();
}

export function sampleSessions() {
  return [
    { id: "s1", topic: SAMPLE_TOPIC, scheduledAt: upcomingSession(1, 16), duration: 90, status: "SCHEDULED" as const },
    { id: "s2", topic: SAMPLE_TOPIC, scheduledAt: upcomingSession(3, 16), duration: 90, status: "SCHEDULED" as const },
    { id: "s3", topic: "Algebraic Expressions", scheduledAt: upcomingSession(8, 16), duration: 60, status: "SCHEDULED" as const },
  ];
}
