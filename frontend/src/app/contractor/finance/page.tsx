"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Link2,
  IndianRupee,
  Trash2,
  Building2,
  FileSignature,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  HandCoins,
  Receipt,
} from "lucide-react";
import { financeApi } from "@/lib/api";
import { payForFinanceSubscription } from "@/lib/razorpay";
import SubscriptionCard from "@/components/finance/SubscriptionCard";
import ContractorSidebar from "@/components/contractor/ContractorSidebar";

const money = (value: number) => {
  const amount = Number(value || 0);
  return `${amount < 0 ? "-" : ""}₹${Math.abs(amount).toLocaleString("en-IN")}`;
};

export default function ContractorFinancePage() {

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    location: "",
    contractValue: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setOverview(await financeApi.overview());
    } catch (err: any) {
      setError(err?.message || "Could not load your finance data.");
    } finally {
      setLoading(false);
    }
  }

  const subscription = overview?.subscription;
  const canWrite = subscription?.canWrite !== false;

  async function subscribe() {
    if (paying) return;

    try {
      setPaying(true);
      const paid = await payForFinanceSubscription();
      // False means the contractor closed the payment window — not an error.
      if (paid) await load();
    } catch (err: any) {
      setError(err?.message || "Payment could not be completed.");
    } finally {
      setPaying(false);
    }
  }

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      await financeApi.createProject({
        ...form,
        contractValue: Number(form.contractValue || 0),
      });
      setShowCreate(false);
      setForm({ name: "", clientName: "", location: "", contractValue: "", startDate: "", endDate: "" });
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not create the project.");
    } finally {
      setSaving(false);
    }
  }

  async function trackConstrobidProject(sourceProjectId: string, title: string) {
    try {
      await financeApi.createProject({ name: title, sourceProjectId });
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not add that project.");
    }
  }

  const summary = overview?.summary;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">

      <ContractorSidebar />

      <main className="flex-1 lg:ml-64 px-6 py-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl space-y-6">

          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-[#4d0e27] p-8 text-white shadow-[0_18px_50px_rgba(112,21,58,0.25)]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-secondary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Your books
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Project Finance</h1>
                <p className="mt-2 max-w-xl text-sm text-white/70">
                  Materials, labour and client payments across every job — on ConstroBID or your own.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contractor/finance/trash"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <Trash2 size={16} />
                  Trash
                </Link>

                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  disabled={!canWrite}
                  title={canWrite ? "" : "Subscribe to add projects"}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-[#40101f] shadow-lg transition hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  New Project
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-500">Loading your projects...</p>
          ) : (
            <>
              <SubscriptionCard subscription={subscription} paying={paying} onPay={subscribe} />

              <div className="motion-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Projects",
                    value: String(summary?.projectCount ?? 0),
                    hint: "Being tracked",
                    icon: Building2,
                    tint: "bg-primary/5",
                    chip: "bg-primary/10 text-primary",
                    text: "text-primary",
                  },
                  {
                    label: "Contract Value",
                    value: money(summary?.contractValue),
                    hint: "Agreed with clients",
                    icon: FileSignature,
                    tint: "bg-blue-50/70",
                    chip: "bg-blue-100 text-blue-700",
                    text: "text-blue-700",
                  },
                  {
                    label: "Spent",
                    value: money(summary?.spent),
                    hint: "Materials and labour",
                    icon: ArrowDownRight,
                    tint: "bg-amber-50/70",
                    chip: "bg-amber-100 text-amber-700",
                    text: "text-amber-700",
                  },
                  {
                    label: "Received",
                    value: money(summary?.received),
                    hint: "Paid by clients",
                    icon: ArrowUpRight,
                    tint: "bg-emerald-50/70",
                    chip: "bg-emerald-100 text-emerald-700",
                    text: "text-emerald-700",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-2xl border border-slate-200/80 ${card.tint} p-5`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        {card.label}
                      </p>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.chip}`}>
                        <card.icon size={17} />
                      </span>
                    </div>

                    <p className={`mt-3 text-2xl font-bold tabular-nums ${card.text}`}>{card.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  {
                    label: "Owed to you",
                    value: money(summary?.owedToMe),
                    hint: "Contract value your clients have not paid yet",
                    icon: HandCoins,
                    frame: "border-emerald-200 bg-emerald-50/60",
                    chip: "bg-emerald-100 text-emerald-700",
                    text: "text-emerald-700",
                  },
                  {
                    label: "You owe",
                    value: money(summary?.owedByMe),
                    hint: "Budgeted material and labour still unpaid",
                    icon: Receipt,
                    frame: "border-amber-200 bg-amber-50/60",
                    chip: "bg-amber-100 text-amber-700",
                    text: "text-amber-700",
                  },
                ].map((card) => (
                  <div key={card.label} className={`rounded-2xl border p-5 ${card.frame}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {card.label}
                        </p>
                        <p className={`mt-2 text-3xl font-bold tabular-nums ${card.text}`}>
                          {card.value}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                      </div>

                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.chip}`}>
                        <card.icon size={20} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {overview?.linkable?.length > 0 && (
                <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                    <Link2 size={16} />
                    You have {overview.linkable.length} ConstroBID project
                    {overview.linkable.length === 1 ? "" : "s"} — add them to finance tracking
                  </div>

                  <div className="space-y-2">
                    {overview.linkable.map((project: any) => (
                      <div
                        key={project._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/60 bg-white px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{project.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {project.clientName || "Client"} · {project.city || "—"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => trackConstrobidProject(project._id, project.title)}
                          disabled={!canWrite}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-bold text-primary">Your Projects</h2>
                  <span className="text-xs font-semibold text-slate-400">
                    {overview?.projects?.length || 0} tracked
                  </span>
                </div>

                {overview?.projects?.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <IndianRupee className="mx-auto text-slate-300" size={40} />
                    <p className="mt-3 font-semibold text-slate-700">No projects yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Add a ConstroBID job above, or create your own project to start tracking money.
                    </p>
                  </div>
                ) : (
                  <div className="motion-stagger divide-y divide-slate-100">
                    {overview?.projects?.map((project: any) => (
                      <Link
                        key={project._id}
                        href={`/contractor/finance/${project._id}`}
                        className="group flex items-center gap-3 px-4 py-4 transition hover:bg-primary/[0.03] sm:gap-4 sm:px-5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary sm:h-11 sm:w-11">
                            {String(project.name || "?").trim().charAt(0).toUpperCase()}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-slate-900">{project.name}</p>
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
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {project.clientName || "No client name"} · {project.location || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4 sm:gap-5">
                          <div className="hidden text-right sm:block">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Contract
                            </p>
                            <p className="font-bold tabular-nums text-slate-900">
                              {money(project.contractValue)}
                            </p>
                          </div>

                          <div className="hidden text-right md:block">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Spent
                            </p>
                            <p className="font-bold tabular-nums text-slate-900">
                              {money(project.spent)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Profit
                            </p>
                            <p
                              className={`font-bold tabular-nums ${
                                Number(project.grossProfit || 0) >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {money(project.grossProfit)}
                            </p>
                          </div>

                          <ChevronRight
                            size={18}
                            className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />

          <form
            onSubmit={createProject}
            className="relative z-10 my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">New Project</h3>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-600">
                Project name
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Whitefield 3BHK Interiors"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Client name
                  <input
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Location
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Contract value (₹)
                <input
                  type="number"
                  min="0"
                  value={form.contractValue}
                  onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                  placeholder="0"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Start date
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Expected completion
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}


    </div>
  );
}
