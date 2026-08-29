"use client";

import { Lock, Clock } from "lucide-react";

interface Props {
  subscription: any;
  paying: boolean;
  onPay: () => void;
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Three states, three messages. The expired card is deliberately reassuring
 * about the data before it asks for money — nothing has been taken away, only
 * editing is paused.
 */
export default function SubscriptionCard({ subscription, paying, onPay }: Props) {
  if (!subscription) return null;

  const { status, trialDaysLeft, validUntil } = subscription;

  if (status === "active") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        Project Finance is active. Next renewal on{" "}
        <span className="font-semibold">{formatDate(validUntil)}</span>.
      </div>
    );
  }

  if (status === "trialing") {
    // Stay quiet until the trial is nearly over.
    if (trialDaysLeft > 3) return null;

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-center gap-3 text-amber-900">
          <Clock size={18} />
          <p className="text-sm font-semibold">
            {trialDaysLeft === 0
              ? "Your free trial ends today"
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial`}
          </p>
        </div>

        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
        >
          {paying ? "Opening payment..." : "Subscribe for ₹149/month"}
        </button>
      </div>
    );
  }

  const lapsed = !!validUntil;

  return (
    <div className="rounded-2xl border border-[#D3C2C7] bg-white p-6 shadow-sm">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-amber-700">
        <Lock size={14} />
        Read-only
      </p>

      <h3 className="text-xl font-bold text-[#241318]">
        {lapsed
          ? `Your subscription ended on ${formatDate(validUntil)}`
          : "Your free trial has ended"}
      </h3>

      <p className="mt-2 max-w-lg text-sm text-slate-600">
        Your projects, payments and reports are safe and still visible. Unlock adding and editing
        for ₹149 a month.
      </p>

      <button
        type="button"
        onClick={onPay}
        disabled={paying}
        className="mt-5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
      >
        {paying ? "Opening payment..." : lapsed ? "Renew for ₹149" : "Pay ₹149 to unlock"}
      </button>

      <p className="mt-3 text-xs text-slate-500">
        Cancel any time. Your data stays yours either way.
      </p>
    </div>
  );
}
