'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MessagesSidebar from '@/components/messages/MessagesSidebar';
import InspectorConversation from "@/components/messages/InspectorConversation";
import { ArrowLeft } from 'lucide-react';

const SELECTED_CONVERSATION_KEY = 'inspection:selectedConversation';

export default function Messages() {
  const [selectedConv, setSelectedConv] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SELECTED_CONVERSATION_KEY);
  });

  const selectConversation = (id: string | null) => {
    setSelectedConv(id);

    if (typeof window === 'undefined') return;

    if (id) {
      sessionStorage.setItem(SELECTED_CONVERSATION_KEY, id);
    } else {
      sessionStorage.removeItem(SELECTED_CONVERSATION_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900">
      <div className="w-full h-[calc(100vh-32px)] p-4">

        <AnimatePresence mode="wait">

          {!selectedConv ? (
            <motion.div
              key="messages"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-full">
  <MessagesSidebar
    selectedConversation={selectedConv}
    onSelectConversation={(id: string) =>
      selectConversation(id)
    }
  />
</div>
              
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div className="border-b px-6 py-4 flex items-center gap-4">

                <button
                  onClick={() => selectConversation(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Back to messages"
                  title="Back to messages"
                >
                  <ArrowLeft size={20} />
                </button>

                <div>
                  <h2 className="font-semibold text-lg">
                    Project Conversation
                  </h2>
                  <p className="text-sm text-gray-500">
                    Design Discussion
                  </p>
                </div>
              </div>

              <InspectorConversation
    conversationId={selectedConv}
/>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
