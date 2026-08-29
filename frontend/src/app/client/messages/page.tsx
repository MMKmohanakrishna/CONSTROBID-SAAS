  "use client";

  import React, { useEffect, useState } from "react";
  import { ArrowLeft } from 'lucide-react';
  import { AnimatePresence, motion } from 'framer-motion';
  import { useAuth } from '@/context/AuthContext';
  import MessagesSidebar from "@/components/messages/MessagesSidebar";
  import ClientConversation from "@/components/messages/ClientConversation";
  import InspectorConversation from "@/components/messages/InspectorConversation";
  import { NotificationProvider } from '@/context/NotificationContext';

  const SELECTED_CONVERSATION_KEY = 'client:selectedConversation';

  export default function ClientMessagesPage() {
    const [selectedConv, setSelectedConv] = useState<string | null>(null);
const [mounted, setMounted] = useState(false);
    const { user } = useAuth();
    const role =
    user?.role ||
    (user as any)?.profile?.role ||
    "";
    useEffect(() => {
  setMounted(true);

  const stored = sessionStorage.getItem(SELECTED_CONVERSATION_KEY);

  if (stored) {
    setSelectedConv(stored);
  }
}, []);

    const selectConversation = (id: string | null) => {
      setSelectedConv(id);

      if (typeof window === 'undefined') return;

      if (id) {
        sessionStorage.setItem(SELECTED_CONVERSATION_KEY, id);
      } else {
        sessionStorage.removeItem(SELECTED_CONVERSATION_KEY);
      }
    };

    if (!mounted) {
  return null;
}

    return (
      <NotificationProvider>
        <div className="min-h-screen bg-[#F4F5F7]">
              <div className="h-screen overflow-y-auto p-4">

    <div className="w-full min-h-full p-4 flex flex-col">

      <AnimatePresence initial={false} mode="wait">

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
                onSelectConversation={(id: string) => selectConversation(id)}
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
            className="h-full flex flex-col"
          >
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
                <h2 className="font-semibold text-lg">Project Conversation</h2>
                <p className="text-sm text-gray-500">Design Discussion</p>
              </div>
            </div>

            <div className="flex-1">
              {role === "CLIENT" ? (
                <ClientConversation conversationId={selectedConv} />
              ) : (
                <InspectorConversation conversationId={selectedConv} />
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
      </div>
          </div>
      </NotificationProvider>
    );
  }
