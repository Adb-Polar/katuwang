"use client";

import { useState } from "react";
import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

interface Setting {
  key: string;
  value: boolean;
}

const SETTING_META: Record<string, { label: string; description: string }> = {
  requireCertificationForClassCreation: {
    label: "Require certification for class creation",
    description: "When enabled, tutors can only create classes for topics they hold a CERTIFIED certification for.",
  },
  registrationOpen: {
    label: "Registration open",
    description: "When disabled, new learner and tutor registrations are rejected.",
  },
  matchingEnabled: {
    label: "Class matching & topic requests",
    description:
      "When disabled, the learner 'Auto Match' matcher and topic requests (and the tutor request queue) are turned off.",
  },
  showTutorRealNames: {
    label: "Show tutor real names to learners",
    description:
      "When enabled, learners see a tutor's real name and section on the tutor profile page. Leave OFF to keep the double-blind anonymity required by RA 10173 (Data Privacy Act).",
  },
};

export default function PlatformSettingsForm() {
  const { data: settings, loading, error, setError, refetch } = useFetchList<Setting>(
    "/api/admin/settings",
    "Could not retrieve platform settings."
  );
  const [success, setSuccess] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const toggle = async (key: string, nextValue: boolean) => {
    setSavingKey(key);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: nextValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update setting.");

      setSuccess(`${SETTING_META[key]?.label || key} is now ${nextValue ? "enabled" : "disabled"}.`);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Platform Settings</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {settings.map((setting) => {
                const meta = SETTING_META[setting.key];
                return (
                  <div key={setting.key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-base-content">{meta?.label || setting.key}</p>
                      {meta?.description && (
                        <p className="text-xs text-base-content/60 mt-0.5">{meta.description}</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={setting.value}
                      disabled={savingKey === setting.key}
                      onChange={(e) => toggle(setting.key, e.target.checked)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
