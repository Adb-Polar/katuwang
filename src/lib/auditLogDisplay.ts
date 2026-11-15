/** Display audit metadata as readable text without exposing internal IDs or JSON. */
export function formatAuditReason(reason: string | null): string | null {
  const text = reason?.trim();
  if (!text) return null;

  // Some older entries prefix their JSON with a subject or topic name.
  const jsonStart = text.search(/[\[{]/);
  if (jsonStart < 0) return text;

  const prefix = text.slice(0, jsonStart).replace(/\s*(?:—|->)\s*$/, "").trim();
  let data: unknown;
  try {
    data = JSON.parse(text.slice(jsonStart));
  } catch {
    // Ordinary prose can contain brackets. Suppress incomplete metadata only.
    return /(?:^|\s)[{\[]\s*["{]/.test(text)
      ? prefix || "Update recorded."
      : text;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return prefix || "Update recorded.";
  }

  const details = data as Record<string, unknown>;
  const previousTopic = readableText(details.previousTopic);
  if (previousTopic && Array.isArray(details.replacements)) {
    const replacements = details.replacements.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object" && !Array.isArray(item)
    );
    const topics = replacements.map((item) => readableText(item.topic)).filter(Boolean);
    const summary = topics.length
      ? `${previousTopic} → ${topics.join(", ")}.`
      : `${previousTopic} archived without a replacement.`;
    const status = details.reassessmentRequired === true
      ? "Reassessment required."
      : replacements.length > 0 && replacements.every((item) => item.status === "CERTIFIED")
        ? details.previousStatus === "CERTIFIED" ? "Certified status retained." : "Certified."
        : "";
    return [summary, status].filter(Boolean).join(" ");
  }

  const message = readableText(details.reason)
    || readableText(details.summary)
    || readableText(details.message);
  return [prefix, message].filter(Boolean).join(" — ") || "Update recorded.";
}

function readableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  // Nested serialized metadata is not a user-facing message either.
  return text && !/[\[\]{}]/.test(text) ? text : null;
}
