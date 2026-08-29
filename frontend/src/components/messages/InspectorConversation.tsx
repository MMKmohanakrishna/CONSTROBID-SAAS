"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatMessages from "./ChatMessages";
import DesignUploadCard from "./DesignUploadCard";
import { Send, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { appendMessage } from "@/lib/messages";
import { useConversationSocket } from "@/hooks/useConversationSocket";
import { useOptionalNotification } from "@/context/NotificationContext";

export default function InspectorConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [text, setText] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const router = useRouter();
  // The inspection messages page mounts no NotificationProvider, so this is
  // optional rather than the throwing useNotification().
  const notification = useOptionalNotification();


  useEffect(() => {
    load();
  }, [conversationId]);

  useConversationSocket(
    conversationId,
    (message) => {
      setMessages((current) => appendMessage(current, message));
    },
    (event) => {
      // The client has confirmed the Design & BOQ, so this thread's job is done:
      // send the inspector back to the dashboard to pick up the next step.
      if (event !== "project.designConfirmed") return;

      notification?.setNotification({
        type: "success",
        message: "Client confirmed the Design & BOQ. Returning to your dashboard.",
      });

      sessionStorage.removeItem("inspection:selectedConversation");
      router.push("/inspection/dashboard");
    }
  );

  async function load() {
    const [msgs, p] = await Promise.all([
      apiRequest(`/messages/conversations/${conversationId}`),
      apiRequest(`/projects/${conversationId}`),
    ]);

    setMessages(msgs || []);
    setProject(p);

    apiRequest(
      "/messages/conversations/mark-read",
      {
        method: "POST",
        body: JSON.stringify({
          conversationId,
        }),
      }
    ).catch(console.log);
  }

  async function send() {
    const msg = await apiRequest(
      "/messages/send",
      {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          content: text,
        }),
      }
    );

    setMessages((m) => appendMessage(m, msg));
    setText("");
  }

  return (
    <div className="no-scroll-reveal flex flex-col h-full p-6">

      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">
          {project?.title}
        </h2>

        <p className="text-slate-500">
          Chat with Client
        </p>
      </div>

      <div className="mb-5 rounded-2xl border bg-white shadow-sm overflow-hidden">

    <button
        onClick={() => setUploadOpen(!uploadOpen)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition"
    >

        <div className="flex items-center gap-4">

            <div className="w-11 h-11 rounded-xl bg-[#6B0F2D]/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-[#6B0F2D]" />
            </div>

            <div className="text-left">
                <h3 className="font-semibold text-lg">
                    Upload Design &amp; BOQ
                </h3>

                <p className="text-sm text-slate-500">
                    Upload the latest Design and BOQ (Bill of Quantity) files for the client.
                </p>
            </div>

        </div>

        {uploadOpen ? (
            <ChevronUp size={22} />
        ) : (
            <ChevronDown size={22} />
        )}

    </button>

    {uploadOpen && (

        <div className="border-t p-6">

            <div className="grid gap-6">
                <DesignUploadCard
                    projectId={conversationId}
                />
            </div>

        </div>

    )}

</div>

      <div className="flex-1 min-h-0 rounded-2xl border bg-white shadow-sm flex flex-col">

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <ChatMessages messages={messages} />
        </div>

        <div className="border-t p-4 flex gap-3 bg-white">

          <input
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            className="flex-1 border rounded-xl px-4"
            placeholder="Type your message..."
          />

          <button
  onClick={send}
  className="h-11 px-6 bg-[#6B0F2D] hover:bg-[#5A0D26] active:scale-95 transition-all duration-200 rounded-lg text-white font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
  aria-label="Send message"
  title="Send message"
>
  <Send size={18} strokeWidth={2.2} />
  <span>Send</span>
</button>

        </div>

      </div>
    </div>
  );
}
