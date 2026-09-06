"use client";

import { useEffect, useState } from "react";
import { useFetchList } from "@/hooks/useFetchList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

interface Setting {
  key: string;
  value: boolean;
}

type SettingGroup = "General" | "Assessment";

const SETTING_META: Record<string, { label: string; description: string; group: SettingGroup }> = {
  requireCertificationForClassCreation: {
    label: "Require certification for class creation",
    description: "When enabled, tutors can only create classes for topics they hold a CERTIFIED certification for.",
    group: "General",
  },
  registrationOpen: {
    label: "Registration open",
    description: "When disabled, new learner and tutor registrations are rejected.",
    group: "General",
  },
  matchingEnabled: {
    label: "Class matching & class requests",
    description:
      "When disabled, the learner 'Auto Match' matcher and class requests (and the tutor request queue) are turned off.",
    group: "General",
  },
  showTutorRealNames: {
    label: "Show tutor real names to learners",
    description:
      "When enabled, learners see a tutor's real name and section on the tutor profile page. Leave OFF to keep the double-blind anonymity required by RA 10173 (Data Privacy Act).",
    group: "General",
  },
  requireRegistrationApproval: {
    label: "Require admin approval for new registrations",
    description:
      "When enabled, new learner and tutor accounts are created as PENDING and cannot log in until an admin approves them from the Registrations queue.",
    group: "General",
  },
  autoCertifyOnAssessmentPass: {
    label: "Auto-certify tutors who pass an assessment",
    description:
      "When enabled, passing a topic assessment certifies the tutor for that topic immediately. When off, a passing assessment creates a pending certification for an admin to confirm on the Certifications screen.",
    group: "Assessment",
  },
  chatbotEnabled: {
    label: "Chatbot assistant",
    description:
      "When enabled, the in-app help assistant (navigation help, FAQs, and class recommendations) appears in every portal. When off, the widget is hidden and its API rejects requests.",
    group: "General",
  },
  sessionTestsEnabled: {
    label: "Session pre/post-tests",
    description:
      "When enabled, tutors can build and publish a per-session test and learners can start pre/post attempts. When off, creation and starts are rejected — results already collected stay readable.",
    group: "Assessment",
  },
};

interface AssessmentConfig {
  questionCount: number;
  passPercent: number;
  minBankSize: number;
}

const ASSESSMENT_FIELDS: {
  key: keyof AssessmentConfig;
  label: string;
  description: string;
  min: number;
  max: number;
}[] = [
  {
    key: "questionCount",
    label: "Questions per attempt",
    description: "How many questions each assessment attempt serves (capped at the topic's active bank size).",
    min: 1,
    max: 50,
  },
  {
    key: "passPercent",
    label: "Pass mark (%)",
    description: "Percentage of questions a tutor must answer correctly to pass.",
    min: 1,
    max: 100,
  },
  {
    key: "minBankSize",
    label: "Minimum bank size",
    description: "Active questions a topic needs before tutors can be assessed on it.",
    min: 1,
    max: 200,
  },
];

export default function PlatformSettingsForm() {
  const { data: settings, loading, error, setError, refetch } = useFetchList<Setting>(
    "/api/admin/settings",
    "Could not retrieve platform settings."
  );
  const [success, setSuccess] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // ─── Global assessment config ───────────────────────────────────────────
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [draft, setDraft] = useState<Record<keyof AssessmentConfig, string>>({
    questionCount: "",
    passPercent: "",
    minBankSize: "",
  });
  const [savingField, setSavingField] = useState<keyof AssessmentConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/assessment-configs")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((c: AssessmentConfig) => {
        if (cancelled) return;
        setConfig(c);
        setDraft({
          questionCount: String(c.questionCount),
          passPercent: String(c.passPercent),
          minBankSize: String(c.minBankSize),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const saveField = async (field: keyof AssessmentConfig) => {
    if (!config) return;
    const next = Number(draft[field]);
    const meta = ASSESSMENT_FIELDS.find((f) => f.key === field)!;
    if (!Number.isInteger(next) || next < meta.min || next > meta.max) {
      setDraft((d) => ({ ...d, [field]: String(config[field]) }));
      setError(`${meta.label} must be a whole number between ${meta.min} and ${meta.max}.`);
      return;
    }
    if (next === config[field]) return;

    setSavingField(field);
    setError("");
    try {
      const res = await fetch("/api/admin/assessment-configs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update setting.");
      setConfig(data);
      setDraft({
        questionCount: String(data.questionCount),
        passPercent: String(data.passPercent),
        minBankSize: String(data.minBankSize),
      });
      setSuccess(`${meta.label} saved.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting.");
      setDraft((d) => ({ ...d, [field]: String(config[field]) }));
    } finally {
      setSavingField(null);
    }
  };

  const renderToggle = (setting: Setting) => {
    const meta = SETTING_META[setting.key];
    return (
      <div key={setting.key} className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-semibold text-base-content">{meta?.label || setting.key}</p>
          {meta?.description && <p className="text-xs text-base-content/60 mt-0.5">{meta.description}</p>}
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary shrink-0"
          checked={setting.value}
          disabled={savingKey === setting.key}
          onChange={(e) => toggle(setting.key, e.target.checked)}
        />
      </div>
    );
  };

  const generalToggles = settings.filter((s) => (SETTING_META[s.key]?.group ?? "General") === "General");
  const assessmentToggles = settings.filter((s) => SETTING_META[s.key]?.group === "Assessment");

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">General</h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="divide-y divide-base-200">{generalToggles.map(renderToggle)}</div>
          )}
        </div>
      </section>

      <section className="card kt-card">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Assessment</h2>
          <p className="text-xs text-base-content/60 -mt-1">
            One set of assessment settings, applied to every subject and topic.
          </p>

          {!loading && <div className="divide-y divide-base-200">{assessmentToggles.map(renderToggle)}</div>}

          <div className="border-t border-base-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ASSESSMENT_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-base-content">{f.label}</span>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={draft[f.key]}
                  disabled={config === null || savingField === f.key}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  onBlur={() => saveField(f.key)}
                  className="input input-bordered input-sm text-xs focus:input-primary"
                />
                <span className="text-2xs text-base-content/50">{f.description}</span>
              </label>
            ))}
          </div>
          {config === null && (
            <p className="text-2xs text-base-content/40">Loading assessment settings…</p>
          )}
        </div>
      </section>
    </div>
  );
}
