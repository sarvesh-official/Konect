import { useRef, useEffect, useState } from "react";
import type { ChatMessage } from "../types";

type Props = {
  partnerName: string;
  messages: ChatMessage[];
  selfId: string;
  onSend: (message: string) => void;
  onClose: () => void;
  onFocusChange: (focused: boolean) => void;
};

export default function ChatSidebar({ partnerName, messages, selfId, onSend, onClose, onFocusChange }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div className="fixed right-0 top-0 z-40 flex h-screen w-full flex-col border-l border-charcoal bg-carbon sm:w-80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
        <span className="text-sm text-parchment">
          Chat with <strong className="text-emerald-signal">{partnerName}</strong>
        </span>
        <button
          onClick={onClose}
          className="cursor-pointer text-lg text-slate-steel transition hover:text-snow"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-steel">Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isSelf = msg.id === selfId;
          return (
            <div key={i} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
              <span className="mb-0.5 text-[10px] text-slate-steel">{msg.senderName}</span>
              <span
                className={`inline-block max-w-[85%] rounded-md px-3 py-1.5 text-sm ${
                  isSelf
                    ? "border border-emerald-signal/30 bg-emerald-signal/10 text-mint"
                    : "border border-charcoal bg-abyss text-parchment"
                }`}
              >
                {msg.message}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-charcoal p-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          autoFocus
          className="flex-1 rounded-md border border-charcoal bg-abyss px-3 py-2 text-sm text-snow placeholder-slate-steel outline-none transition focus:border-emerald-signal"
        />
        <button
          onClick={handleSend}
          className="cursor-pointer rounded-md border border-mint bg-carbon px-4 py-2 text-sm font-semibold text-mint transition hover:bg-emerald-signal/10"
        >
          Send
        </button>
      </div>
    </div>
  );
}
