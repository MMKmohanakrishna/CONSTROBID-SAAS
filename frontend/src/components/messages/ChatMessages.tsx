"use client";
import React, { useEffect, useRef } from 'react';
import MessageBubble from "./MessageBubble";

export default function ChatMessages({ messages = [] }: { messages: any[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Prefer scrolling the component itself if it's scrollable,
    // otherwise scroll the nearest parent that is scrollable.
    let scrollEl: HTMLElement | null = null;
    if (el.scrollHeight > el.clientHeight) scrollEl = el;
    else if (el.parentElement && el.parentElement.scrollHeight > el.parentElement.clientHeight) scrollEl = el.parentElement;

    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }, [messages]);

  return (
    <div ref={ref} className="space-y-3">
      {messages.map((m, i) => (
        <MessageBubble key={i} message={m} />
      ))}
    </div>
  );
}
