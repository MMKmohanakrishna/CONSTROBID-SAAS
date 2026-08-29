"use client";

import React, { useEffect, useState } from "react";
import { Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { filterConversations } from "@/lib/conversations";

type Conv = {
  conversationId: string;
  projectTitle: string;
  chatWith: string;
  lastMessage: any;
  unreadCount: number;
  projectStatus: string;
};

const CONVERSATIONS_CACHE_KEY = "messages:conversations";

function getCachedConversations(): Conv[] {
  if (typeof window === "undefined") return [];

  try {
    const cached = sessionStorage.getItem(CONVERSATIONS_CACHE_KEY);
    return cached ? filterConversations<Conv>(JSON.parse(cached)) : [];
  } catch {
    return [];
  }
}

export default function ConversationList({
  onSelect,
  selectedConversation,
}: {
  onSelect?: (id: string) => void;
  selectedConversation?: string | null;
}) {
  const [items, setItems] = useState<Conv[]>(() => getCachedConversations());
const [loading, setLoading] = useState(() => getCachedConversations().length === 0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/messages/conversations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (cancelled) return;

        sessionStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(data));
        setItems(filterConversations(data));
      } catch (err) {
        console.log(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    // Keep the sender name, preview and unread badge in step with the sidebar
    // badge, which polls on the same interval.
    const interval = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-3 motion-stagger">
      {loading ? (
  <div className="p-4 text-sm text-slate-500">
    Loading conversations...
  </div>
) : items.length === 0 ? (
  <div className="p-4 text-sm text-slate-500">
    No conversations found
  </div>
) : null}

      {items.map((it) => {
        const id = String(it.conversationId);
        const active = selectedConversation === id;

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => onSelect?.(id)}
            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 ${
              active
                ? "bg-slate-100 border border-slate-200 shadow-sm"
                : "hover:bg-slate-50 hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <Users
                size={18}
                className="text-[#6B0F2D]"
              />
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium">
                {it.projectTitle}
                <div className="text-xs font-semibold text-[#6B0F2D]">
  {it.chatWith}
</div>
              </div>

              <div className="text-xs text-slate-500 truncate">
                {it.lastMessage?.content || "No messages"}
              </div>
            </div>

            <div className="text-xs text-right">
              <div className="text-[10px] font-semibold text-green-700">
                {it.lastMessage?.createdAt
  ? new Date(it.lastMessage.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  : ""}
              </div>

              <div className="mt-1">
                {it.unreadCount > 0 ? (
                  <motion.span
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex bg-red-500 text-white rounded-full px-2 py-1 text-xs"
                  >
                    {it.unreadCount}
                  </motion.span>
                ) : (
                  <FileText size={16} />
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
