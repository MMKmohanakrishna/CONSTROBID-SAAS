"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

/**
 * Keeps a conversation subscribed to its Socket.IO room and delivers incoming
 * messages for it.
 *
 * Socket.IO does NOT restore room membership after a reconnect — the socket
 * comes back with the same client but an empty room set. Joining only on mount
 * means any reconnect (backend restart, dev server reload, network blip) leaves
 * the thread silently connected but no longer receiving `message` events, until
 * the page is refreshed. So we re-join on every `connect`, not just on mount.
 *
 * Incoming messages are filtered by conversationId because the server also
 * broadcasts on other channels; without it a thread could append a message that
 * belongs to a different project.
 */
export function useConversationSocket(
  conversationId: string | undefined,
  onMessage: (message: any) => void,
  onEvent?: (event: string, payload: any) => void
) {
  const onMessageRef = useRef(onMessage);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onEventRef.current = onEvent;
  }, [onMessage, onEvent]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const join = () => socket.emit("join", conversationId);

    join();
    socket.on("connect", join);

    const handleMessage = (message: any) => {
      const target = message?.conversationId;
      if (target && String(target) !== String(conversationId)) return;
      onMessageRef.current(message);
    };

    // Project-level events that a thread may want to react to. Filtered by
    // projectId for the same reason messages are: the room is per project, but
    // a stale or broadcast payload must not act on the wrong conversation.
    const projectEvents = ["project.designConfirmed"];

    const handlers = projectEvents.map((event) => {
      const handler = (payload: any) => {
        const target = payload?.projectId;
        if (target && String(target) !== String(conversationId)) return;
        onEventRef.current?.(event, payload);
      };
      socket.on(event, handler);
      return [event, handler] as const;
    });

    socket.on("message", handleMessage);

    return () => {
      socket.emit("leave", conversationId);
      socket.off("connect", join);
      socket.off("message", handleMessage);
      handlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [conversationId]);
}

export default useConversationSocket;
