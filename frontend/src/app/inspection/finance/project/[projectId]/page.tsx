"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { financeAdminApi } from "@/lib/api";
import { useLightbox } from "@/context/LightboxContext";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const shortDate = (value: any) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

// No Diary: it is private to the contractor.
const TABS = ["Overview", "Materials", "Labour", "Daily Log", "Payments"] as const;

export default function InspectorFinanceProjectPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const { openFile } = useLightbox();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<string>("Overview");

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setData(await financeAdminApi.project(String(projectId)));
    } catch (err: any) {
      setError(err?.message || "Could not load this project.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-slate-500">Loading...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-10 text-center">
        <p className="text-rose-600">{error || "Project not found."}</p>
      </div>
    );
  }

  const { project, contractor, materials, labour, logs, payments, pnl } = data;
  const profitable = pnl.grossProfit >= 0;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="w-full space-y-6">

        <button
          type="button"
          onClick={() => router.push(`/inspection/finance/${project.contractorId}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to contractor
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    project.sourceProjectId
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {project.sourceProjectId ? "ConstroBID" : "Own"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {contractor?.companyName || contractor?.name} · {project.clientName || "No client"} ·{" "}
                {project.location || "—"}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Eye size={13} />
              Read only
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === item
                  ? "bg-primary text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-6 shadow-sm ${
                profitable ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Gross profit</p>
              <p
                className={`mt-1 text-4xl font-bold tabular-nums ${
                  profitable ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {money(pnl.grossProfit)}
              </p>
              {pnl.spendPercent !== null && (
                <p className="mt-2 text-xs text-slate-600">
                  Spent {pnl.spendPercent}% of contract value · {money(pnl.spent)} of{" "}
                  {money(pnl.contractValue)}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Contract value", value: money(pnl.contractValue) },
                { label: "Received", value: money(pnl.received) },
                { label: "Outstanding", value: money(pnl.outstanding) },
                { label: "Total spent", value: money(pnl.spent) },
                { label: "Material budget", value: money(pnl.material.budget) },
                { label: "Material paid", value: money(pnl.material.paid) },
                { label: "Labour budget", value: money(pnl.labour.budget) },
                { label: "Labour paid", value: money(pnl.labour.paid) },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(tab === "Materials" || tab === "Labour") && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {(tab === "Materials" ? materials : labour).length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No entries recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {(tab === "Materials" ? materials : labour).map((entry: any) => (
                  <div key={entry._id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{entry.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {[entry.quantity, entry.supplier, entry.poNumber, entry.trade, entry.contact]
                            .filter(Boolean)
                            .join(" · ") || "No details"}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-right text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Budget</p>
                          <p className="font-semibold tabular-nums">{money(entry.budget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Paid</p>
                          <p className="font-semibold tabular-nums text-primary">{money(entry.paid)}</p>
                        </div>
                      </div>
                    </div>

                    {entry.updates?.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-l-2 border-slate-100 pl-4">
                        {entry.updates.map((update: any) => (
                          <p key={update._id} className="text-xs text-slate-500">
                            {shortDate(update.date)} · Paid {money(update.paidAdded)}
                            {update.budgetAdded > 0 ? ` · Budget +${money(update.budgetAdded)}` : ""}
                            {update.mode ? ` · ${update.mode}` : ""}
                            {update.note ? ` · ${update.note}` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "Daily Log" && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
                No daily logs recorded.
              </p>
            ) : (
              logs.map((log: any) => (
                <div key={log._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{shortDate(log.date)}</p>
                      <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm text-slate-700">
                        {log.workDone}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-right text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Workers</p>
                        <p className="font-semibold tabular-nums">{log.workers || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Labour</p>
                        <p className="font-semibold tabular-nums">{money(log.labourCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Material</p>
                        <p className="font-semibold tabular-nums">{money(log.materialCost)}</p>
                      </div>
                    </div>
                  </div>

                  {log.photos?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {log.photos.map((photo: string, index: number) => (
                        <button
                          key={photo + index}
                          type="button"
                          onClick={() => openFile(photo)}
                          className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
                        >
                          <img src={photo} alt={`Site photo ${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "Payments" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {payments.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No payments recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((payment: any) => (
                  <div key={payment._id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-semibold tabular-nums text-slate-900">{money(payment.amount)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {shortDate(payment.date)}
                        {payment.mode ? ` · ${payment.mode}` : ""}
                        {payment.note ? ` · ${payment.note}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
