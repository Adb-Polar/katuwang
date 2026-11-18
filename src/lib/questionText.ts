/**
 * Question prompts in the bank are stored as "[Topic] Prompt"; the topic is shown separately, so drop the prefix.
 * With a topic, only that exact prefix is removed; without one (learner session tests don't send it), any leading
 * "[…] " is.
 */
export function displayPrompt(prompt: string, topic?: string): string {
  if (topic) {
    const prefix = `[${topic}]`;
    return prompt.startsWith(prefix) ? prompt.slice(prefix.length).trimStart() : prompt;
  }
  return prompt.replace(/^\[[^\]]+\]\s+/, "");
}
