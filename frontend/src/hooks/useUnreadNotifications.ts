"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  const loadUnread = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const unread = Array.isArray(data)
        ? data.filter((item: any) => item.read === false).length
        : 0;

      setCount(unread);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount: count,
    refreshUnread: loadUnread,
  };
}
