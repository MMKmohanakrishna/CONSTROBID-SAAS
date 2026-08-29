"use client";
import React, { useState } from 'react';
import MessagesSidebar from '@/components/messages/MessagesSidebar';
import ConversationView from '@/components/messages/ConversationView';

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900">
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="flex gap-6">
          <aside className="w-80">
            <MessagesSidebar onSelectConversation={(id: string) => setSelectedConv(id)} selectedConversation={selectedConv} />
          </aside>
          <main className="h-full">
            <ConversationView conversationId={selectedConv} />
          </main>
        </div>
      </div>
    </div>
  );
}
