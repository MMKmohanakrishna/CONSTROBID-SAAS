"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface DateTimePickerModalProps {
  open: boolean;
  onClose: () => void;
  /** YYYY-MM-DD */
  date: string;
  /** 24h "HH:MM" */
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSubmit: () => void | Promise<void>;
  dateLabel?: string;
  timeLabel?: string;
  submitLabel?: string;
  /** Optional note shown under the time picker, e.g. a deadline warning. */
  warningNote?: string;
  /** Disable dates before today. Defaults to true. */
  disablePast?: boolean;
}

/**
 * Two-step themed date + time picker used for scheduling a site visit and
 * setting a bidding deadline — a calendar grid, then an hour/minute/AM-PM
 * picker, matching the rest of the app's rounded maroon/gold styling instead
 * of native browser date/time inputs.
 */
export default function DateTimePickerModal({
  open,
  onClose,
  date,
  time,
  onDateChange,
  onTimeChange,
  onSubmit,
  dateLabel = "Select Date",
  timeLabel = "Set Time",
  submitLabel = "Confirm",
  warningNote,
  disablePast = true,
}: DateTimePickerModalProps) {
  const [step, setStep] = useState<"date" | "time">("date");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  });
  const [submitting, setSubmitting] = useState(false);

  // Re-sync the visible month and step whenever the modal is (re)opened.
  useEffect(() => {
    if (!open) return;
    setStep("date");
    const d = new Date(date);
    setCalendarMonth(Number.isNaN(d.getTime()) ? new Date() : d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const firstWeekday = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const selectedDateObj = (() => {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : d;
  })();

  // time is stored as 24h "HH:MM"; the picker works in 12h + AM/PM.
  // Falls back to 18:00 if the caller hasn't set a time yet (or passed
  // something malformed) so the dial never renders "undefined".
  const [parsedHour, parsedMinute] = time.split(":").map((n) => parseInt(n, 10));
  const hour24 = Number.isNaN(parsedHour) ? 18 : parsedHour;
  const minute = Number.isNaN(parsedMinute) ? 0 : parsedMinute;
  const hour12 = (hour24 % 12) || 12;
  const amPm = hour24 < 12 ? "AM" : "PM";

  const setHour12 = (h12: number) => {
    const isPm = amPm === "PM";
    const h24 = isPm ? (h12 % 12) + 12 : h12 % 12;
    onTimeChange(`${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };
  const setMinute = (m: number) => {
    onTimeChange(`${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };
  const setAmPm = (ampm: "AM" | "PM") => {
    const isPm = ampm === "PM";
    const h24 = isPm ? (hour12 % 12) + 12 : hour12 % 12;
    onTimeChange(`${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {step === "date" ? (
        <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-[#70153A]">{dateLabel}</h3>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70153A]/10 text-[#70153A]">
              <Calendar size={18} />
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 mb-3">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-[#70153A] hover:text-[#70153A]"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-700">
              {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-[#70153A] hover:text-[#70153A]"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} />;
              const cellDate = new Date(calendarYear, calendarMonthIndex, day);
              const isPast = disablePast && cellDate < todayStart;
              const isSelected =
                !!selectedDateObj &&
                selectedDateObj.getFullYear() === calendarYear &&
                selectedDateObj.getMonth() === calendarMonthIndex &&
                selectedDateObj.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    const iso = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    onDateChange(iso);
                  }}
                  className={`aspect-square rounded-full text-xs font-semibold transition ${
                    isSelected
                      ? "bg-[#70153A] text-white"
                      : isPast
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-700 hover:bg-[#70153A]/10"
                  }`}
                >
                  {String(day).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep("time")}
            disabled={!selectedDateObj}
            className="mt-5 w-full rounded-xl bg-[#70153A] py-3 text-sm font-bold text-white hover:bg-[#5d1031] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#70153A]">{timeLabel}</h3>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#70153A]/10 text-[#70153A]">
              <Clock size={18} />
            </span>
          </div>

          <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-full border-8 border-[#70153A]/10 bg-[#faf7f8]">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-[#70153A]">
                {String(hour12).padStart(2, "0")}:{String(minute).padStart(2, "0")}
              </div>
              <div className="text-xs font-bold tracking-widest text-[#efc975]">{amPm}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="relative">
              <select
                value={hour12}
                onChange={(e) => setHour12(parseInt(e.target.value, 10))}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#70153A]"
                aria-label="Hour"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#70153A]"
                aria-label="Minute"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={amPm}
                onChange={(e) => setAmPm(e.target.value as "AM" | "PM")}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#70153A]"
                aria-label="AM or PM"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {warningNote && (
            <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">{warningNote}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-[#70153A] py-3 text-sm font-bold text-white hover:bg-[#5d1031] transition disabled:opacity-60"
          >
            {submitting ? "Working..." : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => setStep("date")}
            className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            &larr; Back to date
          </button>
        </div>
      )}
    </div>
  );
}
