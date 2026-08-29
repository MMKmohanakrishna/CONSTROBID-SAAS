"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatMessages from "./ChatMessages";
import { ChevronDown, ChevronUp, Info, Paperclip, Send, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import ClientSelectionCard from "./ClientSelectionCard";
import { useNotification } from "@/context/NotificationContext";
import { appendMessage } from "@/lib/messages";
import { useConversationSocket } from "@/hooks/useConversationSocket";
import { payToUnlockBoq } from "@/lib/razorpay";

// After this many change requests the thread is escalated to the ConstroBID team
// instead of looping the client and inspector through more revisions.
const CHANGE_REQUEST_LIMIT = 3;

function isChangeRequest(message: any) {
  return (
    message?.meta?.kind === "CHANGE_REQUEST" ||
    String(message?.content || "").startsWith("Change Requested:")
  );
}

export default function ClientConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [text, setText] = useState("");
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [selectedBoqId, setSelectedBoqId] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [requestingChange, setRequestingChange] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [boqUnlocked, setBoqUnlocked] = useState(false);
  const [unlockingBoq, setUnlockingBoq] = useState(false);

  const { setNotification } = useNotification();
  const router = useRouter();

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  useConversationSocket(conversationId, (message) => {
    setMessages((current) => appendMessage(current, message));

    const hasBoq = (message?.attachments || []).some(
      (attachment: any) => String(attachment?.type || "").toLowerCase() === "boq"
    );

    if (hasBoq) loadConversation();
  });

  async function loadConversation() {
    let msgs: any;
    let loadedProject: any;

    try {
      [msgs, loadedProject] = await Promise.all([
        apiRequest(`/messages/conversations/${conversationId}`),
        apiRequest(`/projects/${conversationId}`),
      ]);
    } catch (err) {
      // A remembered selection can point at a project this client no longer
      // has access to. Drop it rather than leaving a broken thread on screen.
      console.error(err);
      sessionStorage.removeItem("client:selectedConversation");
      setNotification?.({
        type: "error",
        message: "That conversation is not available. Please pick one from your messages.",
      });
      return;
    }

    setMessages(msgs || []);
    setProject(loadedProject);
    setSelectedDesignId(loadedProject?.selectedDesignId || "");
    setSelectedBoqId(loadedProject?.selectedBoqId || "");
    setBoqUnlocked(!!loadedProject?.boqUnlocked);

    apiRequest("/messages/conversations/mark-read", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    }).catch(console.log);
  }

  const filesFromMessages = React.useMemo(() => {
    const designs: any[] = [];
    const boqs: any[] = [];

    (messages || []).forEach((message) => {
      (message.attachments || []).forEach((attachment: any) => {
        const type = String(attachment.type || "").toLowerCase();
        if (type !== "design" && type !== "boq") return;

        const file = {
          _id: attachment.fileId,
          filename: attachment.name || attachment.filename,
          fileUrl: attachment.url || attachment.fileUrl,
          createdAt: attachment.createdAt,
        };

        if (type === "boq") boqs.push(file);
        else designs.push(file);
      });
    });

    return { designs, boqs };
  }, [messages]);

  async function send() {
    if (!text.trim()) return;

    const msg = await apiRequest("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        content: text,
      }),
    });

    setMessages((prev) => appendMessage(prev, msg));
    setText("");
  }

  // Sends whatever the client typed to the inspector, tagged as a change request.
  // Routed through /messages/send so it reuses the existing client -> inspector
  // recipient resolution, inspector notification, and live socket delivery.
  async function requestChange() {
    const notes = changeNotes.trim();
    if (requestingChange) return;

    if (!reviewMaterialsReady) {
      setNotification?.({
        type: "error",
        message: "You can request changes once the inspector has shared a Design and a BOQ.",
      });
      return;
    }

    if (changeRequestsExhausted) {
      setNotification?.({
        type: "error",
        message: `You have used all ${CHANGE_REQUEST_LIMIT} change requests. The ConstroBID team will take it from here.`,
      });
      return;
    }

    if (!notes) {
      setNotification?.({
        type: "error",
        message: "Describe the change you need before requesting it.",
      });
      return;
    }

    try {
      setRequestingChange(true);

      const msg = await apiRequest("/messages/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          content: `Change Requested: ${notes}`,
          meta: { kind: "CHANGE_REQUEST" },
        }),
      });

      setMessages((prev) => appendMessage(prev, msg));
      setChangeNotes("");
      setChangeRequestOpen(false);

      const remaining = Math.max(0, CHANGE_REQUEST_LIMIT - (changeRequestCount + 1));
      setNotification?.({
        type: "success",
        message: remaining
          ? `Change request sent to the inspector. ${remaining} remaining.`
          : "Change request sent. This was your final revision — the ConstroBID team will now take over.",
      });
    } catch (err) {
      console.error(err);
      setNotification?.({
        type: "error",
        message: "Unable to send the change request.",
      });
    } finally {
      setRequestingChange(false);
    }
  }

  async function unlockBoq() {
    if (unlockingBoq) return;

    try {
      setUnlockingBoq(true);

      const unlocked = await payToUnlockBoq(conversationId);

      // False means the client closed the payment window; that is not an error.
      if (!unlocked) return;

      await loadConversation();
      setNotification?.({
        type: "success",
        message: "BOQ unlocked. All future revisions are included.",
      });
    } catch (err: any) {
      console.error(err);
      setNotification?.({
        type: "error",
        message: err?.message || "Payment could not be completed.",
      });
    } finally {
      setUnlockingBoq(false);
    }
  }

  async function confirmSelection() {
    try {
      setSaving(true);
      console.log("Selected Design ID:", selectedDesignId);
console.log("Selected BOQ ID:", selectedBoqId);
console.log("Project Design Files:", mergedProject.designFiles);
console.log("Project BOQ Files:", mergedProject.boqFiles);
      await apiRequest(`/projects/${conversationId}/select-files`, {
        method: "PUT",
        body: JSON.stringify({ selectedDesignId, selectedBoqId: selectedBoqId || undefined }),
      });
      await loadConversation();
      setNotification?.({ type: "success", message: "Design & BOQ confirmed successfully." });
      router.push("/client/dashboard");
    } catch (err) {
      console.error(err);
      setNotification?.({ type: "error", message: "Unable to confirm the selected Design & BOQ." });
    } finally {
      setSaving(false);
    }
  }

  const mergedProject = {
    ...(project || {}),
    designFiles: project?.designFiles?.length ? project.designFiles : filesFromMessages.designs,
    boqFiles: project?.boqFiles?.length ? project.boqFiles : filesFromMessages.boqs,
  } as any;
  const hasValidProjectDesign = !!mergedProject?.designFiles?.find((design: any) => design._id === selectedDesignId);

  // There is nothing to request changes against until the inspector has sent
  // at least one Design and one BOQ.
  const reviewMaterialsReady =
    (mergedProject?.designFiles?.length || 0) > 0 && (mergedProject?.boqFiles?.length || 0) > 0;

  const changeRequestCount = React.useMemo(
    () => (messages || []).filter(isChangeRequest).length,
    [messages]
  );
  const changeRequestsExhausted = changeRequestCount >= CHANGE_REQUEST_LIMIT;
  const canRequestChange = reviewMaterialsReady && !changeRequestsExhausted;

  return (
    <div className="no-scroll-reveal flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">{project?.title}</h2>
        <p className="text-slate-500">Design Review</p>
      </div>

      <div className="mb-5 rounded-2xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setReviewOpen(!reviewOpen)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B0F2D]/10 flex items-center justify-center">D</div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">Design &amp; BOQ Review</h3>
              <p className="text-sm text-slate-500">Select the final Design &amp; BOQ for approval</p>
            </div>
          </div>
          {reviewOpen ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </button>

        {reviewOpen && (
          <div className="border-t p-6">
            <ClientSelectionCard
              project={mergedProject}
              selectedDesignId={selectedDesignId}
              setSelectedDesignId={setSelectedDesignId}
              selectedBoqId={selectedBoqId}
              setSelectedBoqId={setSelectedBoqId}
              onConfirm={confirmSelection}
              saving={saving}
              canConfirm={hasValidProjectDesign}
              boqLocked={!boqUnlocked}
              onUnlockBoq={unlockBoq}
              unlocking={unlockingBoq}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 mx-6 mb-6 rounded-2xl border bg-white shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 scroll-smooth">
          <ChatMessages messages={messages} />
        </div>

        {changeRequestsExhausted && (
          <div className="border-t bg-amber-50 px-6 py-4">
            <div className="flex gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Revision limit reached
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  You have used all {CHANGE_REQUEST_LIMIT} change requests. See the inspection
                  team&apos;s reply in the conversation — you can still message them below.
                </p>
              </div>
            </div>
          </div>
        )}

        {changeRequestOpen && canRequestChange && (
          <div className="border-t bg-slate-50 px-6 py-4">
            <label
              htmlFor="change-request-notes"
              className="block text-sm font-semibold text-slate-800"
            >
              What would you like the inspector to change?
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Request {changeRequestCount + 1} of {CHANGE_REQUEST_LIMIT}.
            </p>

            <textarea
              id="change-request-notes"
              rows={3}
              autoFocus
              value={changeNotes}
              onChange={(event) => setChangeNotes(event.target.value)}
              placeholder="e.g. Please widen the kitchen layout and revise the flooring quantities in the BOQ."
              className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6B0F2D]/30"
            />

            <div className="mt-3 flex gap-3">
              <button
                onClick={requestChange}
                disabled={requestingChange || !changeNotes.trim()}
                className="bg-[#6B0F2D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requestingChange ? "Sending..." : "Send Change Request"}
              </button>

              <button
                onClick={() => {
                  setChangeRequestOpen(false);
                  setChangeNotes("");
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!reviewMaterialsReady && !changeRequestsExhausted && (
          <div className="border-t bg-slate-50 px-6 py-3 text-xs text-slate-500">
            You can request changes once the inspector has shared at least one Design and one BOQ.
          </div>
        )}

        <div className="border-t p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 bg-white">
          <div className="flex w-full sm:w-auto sm:flex-1 gap-2">
            <button
              className="shrink-0 p-3 border rounded-xl text-slate-500 hover:bg-slate-50 transition"
              aria-label="Attach file"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="flex-1 min-w-0 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#6B0F2D]/20 focus:border-[#6B0F2D]"
              placeholder="Type your message..."
            />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => setChangeRequestOpen((open) => !open)}
              disabled={!canRequestChange}
              className="flex-1 sm:flex-none justify-center border border-[#6B0F2D] text-[#6B0F2D] px-4 sm:px-5 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap hover:bg-[#6B0F2D]/5 transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Request change from inspector"
              aria-expanded={changeRequestOpen}
              title={
                !reviewMaterialsReady
                  ? "Available once the inspector shares a Design and a BOQ"
                  : changeRequestsExhausted
                  ? `Limit of ${CHANGE_REQUEST_LIMIT} change requests reached`
                  : "Ask the inspector to revise the Design or BOQ"
              }
            >
              <RotateCcw size={18} />
              <span className="hidden sm:inline">
                {`Request Change${
                  changeRequestCount ? ` (${changeRequestCount}/${CHANGE_REQUEST_LIMIT})` : ""
                }`}
              </span>
            </button>

            <button
              onClick={send}
              className="flex-1 sm:flex-none justify-center bg-[#6B0F2D] text-white px-6 rounded-xl flex items-center gap-2 py-3"
              aria-label="Send message"
              title="Send message"
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
