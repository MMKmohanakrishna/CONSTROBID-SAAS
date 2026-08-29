"use client";

import { useEffect, useRef, useState } from "react";
import { filterConversations } from "@/lib/conversations";
import { useOptionalNotification } from "@/context/NotificationContext";

const CONVERSATIONS_CACHE_KEY = "messages:conversations";

export default function useUnreadMessages() {
  const [count, setCount] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);

  const notification = useOptionalNotification();
  const setNotification = notification?.setNotification;

  // Unread per conversation from the previous poll. Starts as null so the very
  // first load never announces the backlog the user already knows about.
  const previousUnread = useRef<Record<string, number> | null>(null);

  const loadUnread = async () => {
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
      sessionStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(data));

      // Only count threads the messages list actually shows, otherwise the
      // badge sticks on conversations the user has no way to open.
      const visible = filterConversations<any>(data);

      setConversations(visible);

      const total = visible.reduce(
        (sum: number, c: any) => sum + (c.unreadCount || 0),
        0
      );

      setCount(total);

      const current: Record<string, number> = {};
      visible.forEach((c: any) => {
        current[String(c.conversationId)] = c.unreadCount || 0;
      });

      const previous = previousUnread.current;
      previousUnread.current = current;

      if (!previous || !setNotification) return;

      // Announce whoever just wrote. `chatWith` is the client's name for the
      // inspector, and "Inspector" for the client.
      const arrived = visible.find(
        (c: any) =>
          (current[String(c.conversationId)] || 0) >
          (previous[String(c.conversationId)] || 0)
      );

      if (arrived) {
        const sender = arrived.chatWith || "your contact";
        const preview = arrived.lastMessage?.content || "";

        setNotification({
          type: "success",
          message: preview
            ? `New message from ${sender}: ${preview}`
            : `New message from ${sender}`,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadUnread();

    const interval = setInterval(loadUnread, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount: count,
    conversations,
    refreshUnread: loadUnread,
  };
}
