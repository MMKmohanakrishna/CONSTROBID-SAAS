"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { isImageUrl, isPdfUrl, fileNameFromUrl } from "@/lib/files";

type LightboxItem = { url: string; name?: string; kind: "image" | "pdf" };

type LightboxContextType = {
  /** Force the overlay open, whatever the URL points at. */
  open: (url: string, name?: string) => void;
  /** Images and PDFs open in the overlay; anything else opens in a new tab. */
  openFile: (url?: string | null, name?: string) => void;
  close: () => void;
};

/** Files the overlay can render itself. Everything else goes to a new tab. */
function viewableKind(url: string): LightboxItem["kind"] | null {
  if (isImageUrl(url)) return "image";
  if (isPdfUrl(url)) return "pdf";
  return null;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

/**
 * Opens uploaded images and PDFs in an overlay instead of navigating away to
 * the storage host (Cloudinary), so the user keeps their place on the page.
 *
 * Rather than requiring every screen to opt in, this intercepts clicks on any
 * anchor pointing at a viewable file. Everything else (Excel, ZIP, unknown
 * types) still opens in a tab — the browser handles those better than we can.
 */
export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<LightboxItem | null>(null);

  const open = useCallback((url: string, name?: string) => {
    if (!url) return;
    setItem({
      url,
      name: name || fileNameFromUrl(url),
      kind: viewableKind(url) || "image",
    });
  }, []);

  const close = useCallback(() => setItem(null), []);

  const openFile = useCallback(
    (url?: string | null, name?: string) => {
      if (!url) return;

      const kind = viewableKind(url);

      if (kind) {
        setItem({ url, name: name || fileNameFromUrl(url), kind });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    },
    []
  );

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Leave the browser's own "open in new tab/window" gestures intact.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      // An explicit download, or an opt-out, should behave normally.
      if (anchor.hasAttribute("download")) return;
      if (anchor.hasAttribute("data-no-lightbox")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const kind = viewableKind(href);
      if (!kind) return;

      event.preventDefault();
      setItem({
        url: anchor.href,
        name: anchor.getAttribute("data-file-name") || fileNameFromUrl(anchor.href),
        kind,
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!item) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    // Stop the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [item, close]);

  return (
    <LightboxContext.Provider value={{ open, openFile, close }}>
      {children}

      <AnimatePresence>
        {item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={item.name || "File preview"}
            className="fixed inset-0 z-[10000] flex flex-col bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          >
            <div className="flex items-center gap-4 text-black">
              <span className="truncate text-sm font-semibold">
                {item.name || (item.kind === "pdf" ? "Document" : "Image")}
              </span>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                data-no-lightbox
                onClick={(event) => event.stopPropagation()}
                className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-black transition hover:bg-white/10 hover:text-black"
              >
                <ExternalLink size={16} />
                Open original
              </a>

              <button
                type="button"
                onClick={close}
                aria-label="Close preview"
                title="Close"
                className="rounded-lg p-2 text-black transition hover:bg-white/10 hover:text-black"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center pt-4">
              {/* Stop propagation so clicking the file itself does not close. */}
              {item.kind === "pdf" ? (
                <motion.iframe
                  key={item.url}
                  initial={{ scale: 0.99, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  src={item.url}
                  title={item.name || "Document preview"}
                  onClick={(event) => event.stopPropagation()}
                  className="h-full w-full max-w-5xl rounded-xl border-0 bg-white shadow-2xl"
                />
              ) : (
                <motion.img
                  key={item.url}
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  src={item.url}
                  alt={item.name || "Preview"}
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return context;
}

export default LightboxProvider;
