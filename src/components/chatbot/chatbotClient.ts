import type { BotReply } from "@/lib/chatbot/types";

export interface ChatTurn {
  from: "user" | "bot";
  text: string;
  reply?: BotReply;
}

/** POST a message to the intent assistant. Throws on non-2xx. */
export async function askChatbot(message: string): Promise<BotReply> {
  const res = await fetch("/api/chatbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "The assistant could not respond.");
  }
  return json.reply as BotReply;
}
