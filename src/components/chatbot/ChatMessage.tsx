"use client";

import Link from "next/link";
import { Bot, User } from "lucide-react";
import { readableSubjects } from "@/lib/displayLabels";
import type { ChatTurn } from "@/components/chatbot/chatbotClient";

interface ChatMessageProps {
  turn: ChatTurn;
  onSuggestion: (text: string) => void;
}

export default function ChatMessage({ turn, onSuggestion }: ChatMessageProps) {
  const isBot = turn.from === "bot";
  const reply = turn.reply;

  return (
    <div className={`chat ${isBot ? "chat-start" : "chat-end"}`}>
      <div className="chat-image avatar avatar-placeholder">
        <div
          className={`w-7 rounded-full grid place-items-center ${
            isBot ? "bg-primary/10 text-primary" : "bg-base-300 text-(--kt-muted)"
          }`}
        >
          {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
      </div>

      <div
        className={`chat-bubble text-sm leading-relaxed ${
          isBot ? "bg-base-200 text-base-content" : "bg-primary text-primary-content"
        }`}
      >
        {turn.text}
      </div>

      {isBot && reply && (
        <div className="chat-footer mt-1.5 flex flex-col gap-1.5">
          {reply.links?.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="btn btn-sm btn-outline btn-primary w-fit text-sm font-medium"
            >
              {l.label} →
            </Link>
          ))}

          {reply.cards?.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm hover:bg-base-200/50 w-full max-w-[16rem]"
            >
              <span className="block font-medium text-base-content">{readableSubjects(c.title)}</span>
              {c.reasons.length > 0 && (
                <span className="block text-(--kt-muted) mt-0.5">{c.reasons.join(" · ")}</span>
              )}
            </Link>
          ))}

          {reply.suggestions && reply.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reply.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestion(s)}
                  className="btn btn-sm btn-outline rounded-full font-normal text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
