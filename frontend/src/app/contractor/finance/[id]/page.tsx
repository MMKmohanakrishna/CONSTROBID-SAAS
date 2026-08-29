"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Save,
  Link2,
  FileText,
  FileSpreadsheet,
  Package,
  HardHat,
  NotebookPen,
  Wallet,
  TrendingUp,
  BookLock,
} from "lucide-react";
import { financeApi, financeLedgerApi, financeRecordsApi } from "@/lib/api";
import { exportProjectExcel } from "@/lib/finance-export";
import { useAuth } from "@/context/AuthContext";
import ContractorSidebar from "@/components/contractor/ContractorSidebar";
import LedgerTab from "@/components/finance/LedgerTab";
import DailyLogTab from "@/components/finance/DailyLogTab";
import PaymentsTab from "@/components/finance/PaymentsTab";
import PnlTab from "@/components/finance/PnlTab";
import DiaryTab from "@/components/finance/DiaryTab";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

/**
 * PRD 6.3 tab strip. Details is live; the money tabs light up as their phases
 * land, and say so rather than opening onto a blank panel.
 */
const TABS = [
  { id: "details", label: "Details", icon: FileText },
  { id: "materials", label: "Materials", icon: Package },
  { id: "labour", label: "Labour", icon: HardHat },
  { id: "logs", label: "Daily Log", icon: NotebookPen },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "pnl", label: "P&L", icon: TrendingUp },
  { id: "diary", label: "Diary", icon: BookLock },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On hold" },
];

function toDateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function FinanceProjectPage() {
  const { id } = useParams();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("details");
  const [exporting, setExporting] = useState(false);

  const { user } = useAuth();

  /** Pulls every record type together into one workbook. */
  async function exportWorkbook() {
    if (exporting) return;

    try {
      setExporting(true);
      setError("");

      const [materials, labour, logs, payments, pnl] = await Promise.all([
        financeLedgerApi.list("materials", String(id)),
        financeLedgerApi.list("labour", String(id)),
        financeRecordsApi.listLogs(String(id)),
        financeRecordsApi.listPayments(String(id)),
        financeRecordsApi.pnl(String(id)),
      ]);

      await exportProjectExcel({ project, materials, labour, logs, payments, pnl });
    } catch (err: any) {
      setError(err?.message || "Could not build the export.");
    } finally {
      setExporting(false);
    }
  }

  const [form, setForm] = useState<any>({
    name: "",
    clientName: "",
    location: "",
    contractValue: "",
    status: "active",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    try {
      setLoading(true);

      const [loaded, sub] = await Promise.all([
        financeApi.getProject(String(id)),
        financeApi.subscription(),
      ]);

      setProject(loaded);
      setSubscription(sub);
      setForm({
        name: loaded.name || "",
        clientName: loaded.clientName || "",
        location: loaded.location || "",
        contractValue: String(loaded.contractValue ?? ""),
        status: loaded.status || "active",
        startDate: toDateInput(loaded.startDate),
        endDate: toDateInput(loaded.endDate),
        notes: loaded.notes || "",
      });
    } catch (err: any) {
      setError(err?.message || "Could not load this project.");
    } finally {
      setLoading(false);
    }
  }

  const canWrite = subscription?.canWrite !== false;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setError("");

      const updated = await financeApi.updateProject(String(id), {
        ...form,
        contractValue: Number(form.contractValue || 0),
      });

      setProject(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Move this project to Trash? You can restore it later.")) return;

    try {
      await financeApi.deleteProject(String(id));
      router.push("/contractor/finance");
    } catch (err: any) {
      setError(err?.message || "Could not delete this project.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
        <ContractorSidebar />
        <main className="flex-1 lg:ml-64 p-10 text-center text-slate-500">Loading project...</main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
        <ContractorSidebar />
        <main className="flex-1 lg:ml-64 p-10 text-center">
          <p className="text-rose-600">{error || "Project not found."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      <ContractorSidebar />

      <main className="flex-1 lg:ml-64 px-6 py-8 pb-24 lg:pb-8">
        <div className="w-full space-y-6">

        <button
          type="button"
          onClick={() => router.push("/contractor/finance")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to Project Finance
        </button>

        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-[#4d0e27] p-7 text-white shadow-[0_18px_50px_rgba(112,21,58,0.25)]">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-secondary/20 blur-2xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    project.sourceProjectId
                      ? "bg-secondary text-[#40101f]"
                      : "bg-white/15 text-white"
                  }`}
                >
                  {project.sourceProjectId ? "ConstroBID" : "Own"}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-white/70">
                {project.clientName || "No client name"} · {project.location || "No location"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                  Contract value
                </p>
                <p className="text-3xl font-bold tabular-nums text-white">
                  {money(project.contractValue)}
                </p>
              </div>

              <button
                type="button"
                onClick={exportWorkbook}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
              >
                <FileSpreadsheet size={16} />
                {exporting ? "Building..." : "Export Excel"}
              </button>
            </div>
          </div>

          {project.sourceProjectId && (
            <p className="relative mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs text-white/80 backdrop-blur">
              <Link2 size={14} />
              Linked to a ConstroBID project. The contract value is yours to edit — change it here if the
              final agreement differs from the quotation.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!canWrite && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Read-only. Subscribe from Project Finance to edit this project again.
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-primary text-white shadow-md before:absolute before:bottom-1.5 before:left-1/2 before:h-0.5 before:w-6 before:-translate-x-1/2 before:rounded-full before:bg-secondary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </div>

        {tab === "materials" && (
          <LedgerTab kind="materials" projectId={String(id)} canWrite={canWrite} />
        )}

        {tab === "labour" && (
          <LedgerTab kind="labour" projectId={String(id)} canWrite={canWrite} />
        )}

        {tab === "logs" && (
          <DailyLogTab
            projectId={String(id)}
            canWrite={canWrite}
            project={project}
            contractorName={
              user?.profile?.profile?.companyName || user?.profile?.profile?.name || ""
            }
          />
        )}

        {tab === "payments" && <PaymentsTab projectId={String(id)} canWrite={canWrite} />}

        {tab === "pnl" && <PnlTab projectId={String(id)} />}

        {tab === "diary" && <DiaryTab projectId={String(id)} canWrite={canWrite} />}

        {tab === "details" && (
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-primary">Project Details</h2>

          {project.sourceProjectId && (
            <p className="mb-4 -mt-2 text-xs text-slate-500">
              Name, client, and location are set by the ConstroBID project and can&apos;t be edited here.
            </p>
          )}

          <fieldset disabled={!canWrite} className="space-y-4 disabled:opacity-70">
            <label className="block text-sm font-medium text-slate-600">
              Project name
              <input
                required
                disabled={!!project.sourceProjectId}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Client name
                <input
                  disabled={!!project.sourceProjectId}
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Location
                <input
                  disabled={!!project.sourceProjectId}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Contract value (₹)
                <input
                  type="number"
                  min="0"
                  value={form.contractValue}
                  onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                >
                  {STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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

            <label className="block text-sm font-medium text-slate-600">
              Notes
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
              />
            </label>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={remove}
              disabled={!canWrite}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete
            </button>

            <div className="flex items-center gap-3">
              {saved && <span className="text-sm font-semibold text-emerald-700">Saved</span>}

              <button
                type="submit"
                disabled={!canWrite || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
        )}
        </div>
      </main>
    </div>
  );
}
