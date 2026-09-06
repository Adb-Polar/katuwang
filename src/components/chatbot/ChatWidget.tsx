"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { askChatbot, type ChatTurn } from "@/components/chatbot/chatbotClient";
import ChatMessage from "@/components/chatbot/ChatMessage";
import { CHAT_HISTORY_KEY } from "@/lib/clientStorage";

const STORAGE_KEY = CHAT_HISTORY_KEY;
const MAX_STORED = 30;

const GREETING: ChatTurn = {
  from: "bot",
  text: "Hi! I'm the Katuwang assistant. I can help you find your way around, answer common questions, and suggest classes. What do you need?",
  reply: {
    text: "",
    intentId: "greeting",
    category: "smalltalk",
    suggestions: ["How do I enroll?", "What can you do?", "Is Katuwang free?"],
  },
};

function loadHistory(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw) as ChatTurn[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  // The panel (and therefore `turns`) is not rendered until the user opens it,
  // so reading localStorage in the lazy initialiser causes no hydration mismatch.
  const [turns, setTurns] = useState<ChatTurn[]>(() =>
    typeof window === "undefined" ? [GREETING] : loadHistory()
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist (capped) whenever the transcript changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-MAX_STORED)));
    } catch {
      // storage unavailable — transcript just won't persist
    }
  }, [turns]);

  // Keep the newest message in view + focus behaviour.
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || sending) return;
    setError("");
    setInput("");
    setTurns((prev) => [...prev, { from: "user", text: message }]);
    setSending(true);
    try {
      const reply = await askChatbot(message);
      setTurns((prev) => [...prev, { from: "bot", text: reply.text, reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant could not respond.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-content shadow-lg hover:brightness-110 transition"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Katuwang assistant"
          className="fixed bottom-20 right-4 z-30 flex w-[min(22rem,calc(100vw-2rem))] max-h-[min(30rem,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-base-200 bg-base-100 px-3 py-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Assistant</p>
              <p className="text-2xs text-base-content/50 leading-tight">Navigation help &amp; FAQs</p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
            {turns.map((t, i) => (
              <ChatMessage key={i} turn={t} onSuggestion={send} />
            ))}
            {sending && (
              <div className="chat chat-start">
                <div className="chat-bubble bg-base-200">
                  <span className="loading loading-dots loading-xs" />
                </div>
              </div>
            )}
          </div>

          {error && <p className="px-3 pb-1 text-2xs text-error">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-base-200 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Ask about Katuwang…"
              aria-label="Message"
              className="input input-sm input-bordered flex-1 text-xs"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-sm btn-primary btn-square"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
