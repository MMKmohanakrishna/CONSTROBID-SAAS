"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { financeRecordsApi } from "@/lib/api";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className={`text-sm ${strong ? "font-bold text-slate-900" : "text-slate-600"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${
          strong ? "text-lg font-bold" : "text-sm font-semibold"
        } ${
          tone === "profit" ? "text-emerald-700" : tone === "loss" ? "text-rose-700" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PnlTab({ projectId }: { projectId: string }) {
  const [pnl, setPnl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setPnl(await financeRecordsApi.pnl(projectId));
    } catch (err: any) {
      setError(err?.message || "Could not load the P&L.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const profitable = pnl.grossProfit >= 0;
  const spendPercent = pnl.spendPercent;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          profitable ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Gross profit</p>
            <p
              className={`mt-1 text-4xl font-bold tabular-nums ${
                profitable ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {money(pnl.grossProfit)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Contract value minus everything paid to materials and labour
            </p>
          </div>

          {profitable ? (
            <TrendingUp className="text-emerald-600" size={40} />
          ) : (
            <TrendingDown className="text-rose-600" size={40} />
          )}
        </div>

        {spendPercent === null ? (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/70 px-4 py-3 text-xs text-slate-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              No contract value set for this project, so profit is just your spend in reverse. Add
              the agreed amount in the Details tab to make this meaningful.
            </span>
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Spent {spendPercent}% of contract value</span>
              <span className="tabular-nums">
                {money(pnl.spent)} / {money(pnl.contractValue)}
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full ${
                  spendPercent > 100 ? "bg-rose-500" : spendPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, spendPercent))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-primary">Client</h3>
          <div className="divide-y divide-slate-100">
            <Row label="Contract value" value={money(pnl.contractValue)} />
            <Row label="Received" value={money(pnl.received)} />
            <Row label="Outstanding" value={money(pnl.outstanding)} strong />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-primary">Spend</h3>
          <div className="divide-y divide-slate-100">
            <Row label="Material budget" value={money(pnl.material.budget)} />
            <Row label="Material paid" value={money(pnl.material.paid)} />
            <Row label="Labour budget" value={money(pnl.labour.budget)} />
            <Row label="Labour paid" value={money(pnl.labour.paid)} />
            <Row label="Total spent" value={money(pnl.spent)} strong />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-primary">Balance to pay out</h3>
        <div className="divide-y divide-slate-100">
          <Row
            label="Material balance"
            value={money(Math.max(0, pnl.material.budget - pnl.material.paid))}
          />
          <Row
            label="Labour balance"
            value={money(Math.max(0, pnl.labour.budget - pnl.labour.paid))}
          />
          <Row
            label="Cash position"
            value={money(pnl.received - pnl.spent)}
            strong
            tone={pnl.received - pnl.spent >= 0 ? "profit" : "loss"}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Cash position is what you have actually received minus what you have actually paid out —
          not the same as profit.
        </p>
      </div>
    </div>
  );
}
