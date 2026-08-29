"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

// Raw backend role enums read poorly as a chat sender label — map them to
// what the client actually understands the other party as.
const ROLE_LABELS: Record<string, string> = {
  INSPECTION_TEAM: "Inspector",
  INSPECTOR: "Inspector",
  CONTRACTOR: "Contractor",
  CLIENT: "Client",
  ADMIN: "ConstroBID Team",
};

function senderLabel(from: any) {
  if (from?.name) return from.name;
  if (from?.fullName) return from.fullName;
  const role = String(from?.role || "").toUpperCase();
  return ROLE_LABELS[role] || "ConstroBID Team";
}

export default function MessageBubble({
  message,
}: {
  message: any;
}) {
  const currentEmail =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}").email
      : "";

  const mine = message.from?.email === currentEmail;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: mine ? 30 : -30,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`flex ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[75%]
          px-4
          py-3
          rounded-2xl
          shadow-sm
          ${
            mine
              ? "bg-[#6B0F2D] text-white rounded-br-md"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
          }
        `}
      >
        {!mine && (
          <div className="text-xs font-semibold text-[#6B0F2D] mb-2">
            {senderLabel(message.from)}
          </div>
        )}

        {/* Message */}
        {message.content && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.attachments.map((file: any, index: number) => {
              const isBoq =
                String(file.type || "").toLowerCase() === "boq";
              const label = isBoq ? "BOQ" : "Design";

              return (
              <div
                key={index}
                className={`rounded-xl border p-4 ${
                  mine
                    ? "bg-white/10 border-white/20"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">

                  {/* Icon */}
                  <div className="text-4xl">{isBoq ? "B" : "D"}</div>

                  {/* File Details */}
                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        mine ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {label} File
                    </h4>

                    <p
                      className={`text-xs mt-1 ${
                        mine
                          ? "text-white/70"
                          : "text-slate-500"
                      }`}
                    >
                      {file.name}
                    </p>
                  </div>
                </div>

                {/* Button. A locked BOQ arrives with no URL, so there is
                    nothing to link to until the unlock is paid. */}
                {file.locked || !file.url ? (
                  <div
                    className={`mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      mine
                        ? "bg-white/20 text-white/80"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Lock size={15} />
                    {label} locked
                  </div>
                ) : (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition ${
                      mine
                        ? "bg-white text-[#6B0F2D] hover:bg-gray-100"
                        : "bg-[#6B0F2D] text-white hover:bg-[#540b24]"
                    }`}
                  >
                    View {label}
                  </a>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Time */}
        <div
          className={`text-[11px] mt-3 ${
            mine ? "text-white/70" : "text-slate-400"
          }`}
        >
          {message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      </div>
    </motion.div>
  );
}