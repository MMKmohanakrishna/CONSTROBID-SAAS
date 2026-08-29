"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConversationPage({ params }: any) {
  const { conversation } = params;
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/messages/conversations/${conversation}`, { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(setMessages).catch(() => setMessages([]));
  }, [conversation]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Conversation {conversation}</h2>
      <div className="mt-4 space-y-2">
        {messages.map((m:any)=> (
          <div key={m._id} className="p-2 border rounded">
            <div className="text-sm text-gray-600">From: {String(m.from)}</div>
            <div className="mt-1">{m.content}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
