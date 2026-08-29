"use client";
import React from 'react';
import ConversationList from './ConversationList';

export default function MessagesSidebar({ onSelectConversation, selectedConversation }: { onSelectConversation?: (id: string) => void; selectedConversation?: string | null }) {
  return (
    <div className="h-full flex flex-col p-4">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-[#6B0F2D]">Messages</h3>
          <p className="text-sm text-slate-500">Recent projects & conversations</p>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <ConversationList onSelect={onSelectConversation} selectedConversation={selectedConversation} />
      </div>
    </div>
  );
}
