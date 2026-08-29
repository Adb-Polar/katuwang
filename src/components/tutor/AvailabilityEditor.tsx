"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type Day = (typeof DAYS)[number];

export interface AvailabilitySlot {
  id?: string;
  day: Day;
  startTime: string;
  endTime: string;
}

let tempIdCounter = 0;
function tempId() {
  tempIdCounter += 1;
  return `draft-${tempIdCounter}`;
}

export default function AvailabilityEditor({ initialSlots }: { initialSlots: AvailabilitySlot[] }) {
  const [slots, setSlots] = useState<(AvailabilitySlot & { key: string })[]>(() =>
    initialSlots.map((s) => ({ ...s, key: s.id ?? tempId() }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addSlot = (day: Day) => {
    setSlots((prev) => [...prev, { key: tempId(), day, startTime: "09:00", endTime: "10:00" }]);
  };

  const removeSlot = (key: string) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

  const updateSlot = (key: string, field: "startTime" | "endTime", value: string) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tutor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slots.map(({ day, startTime, endTime }) => ({ day, startTime, endTime })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability.");
      setSlots(data.map((s: AvailabilitySlot) => ({ ...s, key: s.id ?? tempId() })));
      setSuccess("Availability updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />
      <FeedbackBanner variant="success" message={success || null} />

      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);
          return (
            <div key={day} className="border border-base-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-base-content/80">
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={() => addSlot(day)}
                  className="btn btn-ghost btn-xs text-2xs font-bold gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Slot
                </button>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-2xs text-base-content/40 italic">No availability set.</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div key={slot.key} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(slot.key, "startTime", e.target.value)}
                        className="input input-bordered input-xs text-2xs"
                      />
                      <span className="text-2xs text-base-content/50">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(slot.key, "endTime", e.target.value)}
                        className="input input-bordered input-xs text-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.key)}
                        className="btn btn-ghost btn-xs text-error cursor-pointer"
                        aria-label="Remove slot"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary btn-sm text-xs font-bold cursor-pointer"
      >
        {saving ? <span className="loading loading-spinner loading-xs"></span> : "Save Changes"}
      </button>
    </div>
  );
}
