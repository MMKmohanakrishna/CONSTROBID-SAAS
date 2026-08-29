"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * A themed replacement for a native <select>.
 *
 * The browser draws a native option list itself — the blue highlight and square
 * corners cannot be styled with CSS — so filters that need to match the brand
 * have to render their own listbox.
 *
 * The panel is portalled to <body> and positioned with fixed coordinates taken
 * from the trigger. Rendering it inline left it at the mercy of every ancestor:
 * an overflow rule clipped it and transformed siblings painted over it.
 */
export default function FilterSelect({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLUListElement | null>(null);

  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => setMounted(true), []);

  const position = useCallback(() => {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;

    setRect({ top: box.bottom + 6, left: box.left, width: box.width });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    // Follow the trigger rather than leaving the panel stranded mid-page.
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, position]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-700 transition ${
          open ? "border-primary ring-4 ring-primary/10" : "border-gray-200 hover:border-primary/40"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {mounted &&
        open &&
        rect &&
        createPortal(
          <ul
            ref={panel}
            role="listbox"
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            }}
            className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(112,21,58,0.18)]"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <li key={`${option.value}-${option.label}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-slate-700 hover:bg-slate-50 hover:text-primary"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && <Check size={15} className="shrink-0 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
