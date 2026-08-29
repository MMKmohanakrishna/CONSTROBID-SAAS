"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/socket";

type DataChangedEvent = {
  type?: string;
  domains?: string[];
  projectId?: string;
  conversationId?: string;
  local?: boolean;
};

const DASHBOARD_DOMAINS = [
  "projects",
  "quotations",
  "messages",
  "notifications",
  "reports",
  "designs",
  "files",
  "analytics",
  "completion",
  "monitoring",
  "inspections",
  "contractors",
  "admin",
  "profile",
];

function domainsForPath(pathname: string): string[] {
  if (pathname.includes("/dashboard")) return DASHBOARD_DOMAINS;
  if (pathname.includes("/messages")) return ["messages", "notifications", "projects", "designs", "files"];
  if (pathname.includes("/notifications")) return ["notifications", "messages"];
  if (pathname.includes("/quotations") || pathname.includes("/bids")) return ["quotations", "projects", "contractors"];
  if (pathname.includes("/reports")) return ["reports", "projects", "analytics", "inspections"];
  if (pathname.includes("/design")) return ["designs", "files", "projects", "messages", "notifications"];
  if (pathname.includes("/analytics")) return ["analytics", "projects", "quotations", "reports", "contractors"];
  if (pathname.includes("/profile")) return ["profile", "contractors", "notifications"];
  if (pathname.includes("/monitoring")) return ["monitoring", "projects", "reports", "analytics"];
  if (pathname.includes("/completion")) return ["completion", "projects", "reports", "analytics"];
  if (pathname.includes("/project") || pathname.includes("/my-projects")) return ["projects", "quotations", "reports", "designs", "files", "monitoring", "completion", "messages"];
  if (pathname.includes("/contractor")) return ["contractors", "projects", "quotations", "profile"];
  if (pathname.includes("/inspection")) return ["inspections", "projects", "contractors", "quotations", "reports", "designs", "notifications"];
  if (pathname === "/") return ["projects", "contractors"];
  return [];
}

function shouldRefresh(pathname: string, event: DataChangedEvent) {
  if (pathname.includes("/auth") || pathname.includes("/login")) return false;
  if (pathname.includes("/messages")) return false;
  if (document.querySelector('[role="dialog"], .fixed.inset-0.z-50')) return false;

  const pageDomains = domainsForPath(pathname);
  if (pageDomains.length === 0) return false;

  const eventDomains = event.domains || [];
  if (eventDomains.length === 0) return true;

  return eventDomains.some((domain) => pageDomains.includes(domain));
}

// Bumped every time a relevant DATA_CHANGED event lands. Pages read it to re-fetch.
const RealtimeVersionContext = createContext(0);

/**
 * Re-runs `callback` whenever a realtime event relevant to the current page arrives.
 * Does not fire on mount — pages do their own initial fetch.
 */
export function useRealtimeRefresh(callback: () => void) {
  const version = useContext(RealtimeVersionContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (version === 0) return;
    callbackRef.current();
  }, [version]);
}

export default function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const pathnameRef = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const scheduleRefresh = (event: DataChangedEvent) => {
      if (!shouldRefresh(pathnameRef.current, event)) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setVersion((current) => current + 1);
      }, 250);
    };

    const socket = getSocket();
    const onDataChanged = (event: DataChangedEvent) => scheduleRefresh(event || {});
    const onLocalDataChanged = (event: Event) => {
      scheduleRefresh((event as CustomEvent<DataChangedEvent>).detail || {});
    };
    const onMessage = () => scheduleRefresh({ type: "MESSAGE_SENT", domains: ["messages", "notifications"] });
    const onFilesUploaded = () => scheduleRefresh({ type: "FILE_UPLOADED", domains: ["files", "designs", "messages", "projects"] });
    const onProjectApproved = () => scheduleRefresh({ type: "DESIGN_APPROVED", domains: ["projects", "designs"] });
    const onChangesRequested = () => scheduleRefresh({ type: "PROJECT_UPDATED", domains: ["projects", "messages"] });

    socket?.on("DATA_CHANGED", onDataChanged);
    socket?.on("message", onMessage);
    socket?.on("files.uploaded", onFilesUploaded);
    socket?.on("project.approved", onProjectApproved);
    socket?.on("changes.requested", onChangesRequested);
    window.addEventListener("constrobid:data-changed", onLocalDataChanged);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket?.off("DATA_CHANGED", onDataChanged);
      socket?.off("message", onMessage);
      socket?.off("files.uploaded", onFilesUploaded);
      socket?.off("project.approved", onProjectApproved);
      socket?.off("changes.requested", onChangesRequested);
      window.removeEventListener("constrobid:data-changed", onLocalDataChanged);
    };
  }, []);

  return (
    <RealtimeVersionContext.Provider value={version}>
      {children}
    </RealtimeVersionContext.Provider>
  );
}
