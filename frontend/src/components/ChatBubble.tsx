"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, MessageCircle, Mail, SendHorizontal, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";

type ThreadItem =
  | { kind: "bot"; text: string }
  | { kind: "user"; text: string }
  | { kind: "error"; text: string };

const TOPICS = [
  "Interior Design",
  "Construction Services",
  "Site Inspection",
  "Contractor Verification",
  "Design Review",
];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const refMessages = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const el = refMessages.current;
    if (!el) return;

    let scrollEl: HTMLElement | null = null;
    if (el.scrollHeight > el.clientHeight) scrollEl = el;
    else if (el.parentElement && el.parentElement.scrollHeight > el.parentElement.clientHeight) scrollEl = el.parentElement;

    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }, [open, thread]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail) {
      setThread((prev) => [...prev, { kind: "error", text: "Enter your email so we can reply." }]);
      return;
    }
    if (!trimmedMessage) {
      setThread((prev) => [...prev, { kind: "error", text: "Type a message first." }]);
      return;
    }

    setSending(true);
    setThread((prev) => [...prev, { kind: "user", text: trimmedMessage }]);
    setMessage("");

    try {
      await apiRequest("/support", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, message: trimmedMessage }),
      });
      setSent(true);
      setThread((prev) => [
        ...prev,
        { kind: "bot", text: "Thanks — we've got your message and will reply to your email soon." },
      ]);
    } catch (err: any) {
      setThread((prev) => [
        ...prev,
        { kind: "error", text: err?.message || "Couldn't send that. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      {open && (
        <div className="absolute bottom-20 right-0 flex w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(38,20,30,0.25)]">

          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#6B0F1A] to-[#4a0a12] px-5 py-4 text-white">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/25">
                    CB
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#6B0F1A]" />
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight">ConstroBID Support</h3>
                  <p className="flex items-center gap-1 text-[11px] font-medium text-white/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Usually replies instantly
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                title="Close chat"
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={refMessages} className="max-h-96 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6B0F1A]/10 text-xs font-bold text-[#6B0F1A]">
                CB
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                👋 Welcome to ConstroBID. How can we help today?
              </div>
            </div>

            <div className="ml-9 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <Sparkles size={12} className="text-[#fbb51c]" />
                Popular topics
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setMessage(`I'd like to ask about ${topic}.`)}
                    className="rounded-full border border-[#6B0F1A]/20 bg-[#6B0F1A]/5 px-3 py-1.5 text-xs font-semibold text-[#6B0F1A] transition hover:bg-[#6B0F1A]/10"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {thread.map((item, i) =>
              item.kind === "user" ? (
                <div key={i} className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-[#6B0F1A] px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
                  {item.text}
                </div>
              ) : item.kind === "error" ? (
                <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
                  {item.text}
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6B0F1A]/10 text-xs font-bold text-[#6B0F1A]">
                    CB  
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                    {item.text}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3.5 space-y-2.5">
            {!sent && (
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email, so we can reply"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6B0F1A] focus:bg-white focus:ring-2 focus:ring-[#6B0F1A]/10"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#6B0F1A] focus:bg-white focus:ring-2 focus:ring-[#6B0F1A]/10 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={sending}
                aria-label="Send message"
                title="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B0F1A] text-white shadow-sm transition hover:bg-[#82122A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizontal size={17} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        title={open ? 'Close chat' : 'Open chat'}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6B0F1A] to-[#4a0a12] text-white shadow-2xl transition-all duration-300 hover:scale-110"
      >
        {open ? <X size={26} aria-hidden="true" /> : <MessageCircle size={28} aria-hidden="true" />}
      </button>
    </div>
  );
}
