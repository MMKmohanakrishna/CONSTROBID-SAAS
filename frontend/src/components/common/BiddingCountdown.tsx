"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  deadline: string | Date;
}

export default function BiddingCountdown({ deadline }: Props) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const update = () => {
      const end = new Date(deadline).getTime();
      const now = Date.now();

      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        ),
        minutes: Math.floor(
          (difference % (1000 * 60 * 60)) /
            (1000 * 60)
        ),
        seconds: Math.floor(
          (difference % (1000 * 60)) /
            1000
        ),
        expired: false,
      });
    };

    update();

    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const lessThanOneDay =
    !timeLeft.expired && timeLeft.days === 0;

  if (timeLeft.expired) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={18} />
          <span className="font-bold">
            Bidding Closed
          </span>
        </div>

        <div className="mt-3 text-sm text-gray-700">
          Deadline Passed
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays size={15} />
          {new Date(deadline).toLocaleString("en-IN")}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-4 rounded-xl border p-4 ${
        lessThanOneDay
          ? "border-orange-200 bg-orange-50"
          : "border-green-200 bg-green-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock3
          size={18}
          className={
            lessThanOneDay
              ? "text-orange-600"
              : "text-green-600"
          }
        />

        <span
          className={`font-bold ${
            lessThanOneDay
              ? "text-orange-700"
              : "text-green-700"
          }`}
        >
          {lessThanOneDay
            ? "Ends Today"
            : "Bidding Ends In"}
        </span>
      </div>

      <div
        className={`mt-3 text-2xl font-extrabold ${
          lessThanOneDay
            ? "text-orange-700"
            : "text-green-700"
        }`}
      >
        {timeLeft.days}d {timeLeft.hours}h{" "}
        {timeLeft.minutes}m {timeLeft.seconds}s
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
        <CalendarDays size={15} />
        {new Date(deadline).toLocaleString("en-IN")}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-700">
        <CheckCircle2 size={15} />
        Open for Bidding
      </div>
    </div>
  );
}