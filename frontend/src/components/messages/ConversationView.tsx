"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatMessages from "./ChatMessages";
import { Paperclip, Send } from "lucide-react";
import { projectApi, apiRequest } from "@/lib/api";
import { getSocket } from "../../lib/socket";
import { appendMessage } from "../../lib/messages";

let typingTimeout: any = null;

export default function ConversationView({ conversationId }: { conversationId?: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [project, setProject] = useState<any | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function load() {
      if (!conversationId) {
        setMessages([]);
        setProject(null);
        return;
      }

      try {
        const data = await apiRequest(`/messages/conversations/${conversationId}`);
        setMessages(data || []);
        await apiRequest("/messages/conversations/mark-read", {
          method: "POST",
          body: JSON.stringify({ conversationId }),
        });

        const loadedProject = await projectApi.getById(conversationId);
        setProject(loadedProject);
        setSelectedDesignId(loadedProject?.selectedDesignId || "");
      } catch (error) {
        console.error(error);
      }
    }

    load();
  }, [conversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    // Re-join on every connect: Socket.IO drops room membership on reconnect.
    const join = () => socket.emit("join", conversationId);
    join();
    socket.on("connect", join);

    const onMessage = (message: any) => setMessages((prev) => appendMessage(prev, message));
    const onTyping = ({ user }: any) => {
      setTypingUser(user || "");
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => setTypingUser(""), 1800);
    };
    const onRead = () => setMessages((prev) => prev.map((message) => ({ ...message, read: true })));

    socket.on("message", onMessage);
    socket.on("typing", onTyping);
    socket.on("read", onRead);

    return () => {
      socket.emit("leave", conversationId);
      socket.off("connect", join);
      socket.off("message", onMessage);
      socket.off("typing", onTyping);
      socket.off("read", onRead);
    };
  }, [conversationId]);

  async function send() {
    if (!text.trim() || !conversationId) return;
    try {
      const saved = await apiRequest("/messages/send", {
        method: "POST",
        body: JSON.stringify({ content: text, conversationId }),
      });
      setMessages((prev) => appendMessage(prev, saved));
      getSocket()?.emit("typing", { room: conversationId, user: "" });
      setText("");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAttachFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || !conversationId) return;
    const form = new FormData();
    Array.from(event.target.files).forEach((file) => form.append("images", file));
    form.append("projectId", conversationId);
    form.append("fileCategory", "DESIGN");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (data?.message) setMessages((prev) => appendMessage(prev, data.message));
    } catch (error) {
      console.error(error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
    const socket = getSocket();
    if (!conversationId || !socket) return;
    socket.emit("typing", { room: conversationId, user: "Client" });
  }

  async function confirmSelection() {
    if (!conversationId || !selectedDesignId) return;
    await apiRequest(`/projects/${conversationId}/select-files`, {
      method: "PUT",
      body: JSON.stringify({ selectedDesignId }),
    });
  }

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="border-b pb-4 mb-4">
        <h4 className="text-lg font-semibold">{project?.title || "Project Conversation"}</h4>
        <div className="text-sm text-slate-500">Design discussion</div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-semibold">Design Files</h5>
          <span className="text-xs text-gray-400">{(project?.designFiles || []).length} files</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(project?.designFiles || []).map((design: any) => (
            <div key={design._id || design.id || design.fileUrl} className="flex items-center justify-between p-3 border rounded-lg">
              <button
                onClick={() => setSelectedDesignId(design._id)}
                className={
                  selectedDesignId === design._id
                    ? "bg-green-600 text-white px-4 py-2 rounded"
                    : "bg-[#6B0F2D] text-white px-4 py-2 rounded"
                }
              >
                {selectedDesignId === design._id ? "Selected" : "Select"}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded bg-indigo-50 text-indigo-600">DR</div>
                <div>
                  <div className="text-sm font-semibold">{design.filename || "design.pdf"}</div>
                  <div className="text-xs text-gray-400">
                    Uploaded on {new Date(design.createdAt || design.uploadedAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <a href={design.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded">
                View
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <ChatMessages messages={messages} />
        </div>
        <div className="border-t bg-white p-4 flex items-center gap-3">
          <input ref={fileInputRef} onChange={handleAttachFile} type="file" multiple className="hidden" aria-label="Attach files" />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-white border border-slate-200" aria-label="Attach files" title="Attach files">
            <Paperclip size={16} />
          </button>
          <input
            value={text}
            onChange={onInputChange}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6B0F2D]"
            placeholder="Type your message..."
          />
          <button onClick={send} className="inline-flex items-center gap-2 bg-[#6B0F2D] hover:bg-[#500b21] text-white px-5 py-3 rounded-xl transition">
            <Send size={16} />
            Send
          </button>
        </div>
        {typingUser && <div className="text-xs text-slate-500 mt-2">{typingUser} is typing...</div>}
        <button
          onClick={confirmSelection}
          disabled={!selectedDesignId}
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}
