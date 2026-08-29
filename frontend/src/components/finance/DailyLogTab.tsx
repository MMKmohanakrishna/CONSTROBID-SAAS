"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Trash2, ImagePlus, NotebookPen, FileDown } from "lucide-react";
import { apiRequest, financeRecordsApi } from "@/lib/api";
import { useLightbox } from "@/context/LightboxContext";
import { exportDailyLogPdf } from "@/lib/finance-export";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const MODES = ["cash", "upi", "bank", "cheque"];

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  workDone: "",
  workers: "",
  labourCost: "",
  materialCost: "",
  mode: "cash",
  poNumber: "",
  notes: "",
};

export default function DailyLogTab({
  projectId,
  canWrite,
  project,
  contractorName,
}: {
  projectId: string;
  canWrite: boolean;
  project?: any;
  contractorName?: string;
}) {
  const { openFile } = useLightbox();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [photos, setPhotos] = useState<string[]>([]);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  // Reports are readable without a subscription: the data is already theirs.
  async function downloadReport(log: any) {
    try {
      setReportingId(log._id);
      await exportDailyLogPdf(log, project || {}, contractorName);
    } catch (err: any) {
      setError(err?.message || "Could not build that report.");
    } finally {
      setReportingId(null);
    }
  }

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setLogs((await financeRecordsApi.listLogs(projectId)) || []);
    } catch (err: any) {
      setError(err?.message || "Could not load the daily log.");
    } finally {
      setLoading(false);
    }
  }

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;

    try {
      setUploading(true);

      const form = new FormData();
      files.forEach((file) => form.append("images", file));

      const uploaded: any = await apiRequest("/uploads", { method: "POST", body: form });
      const urls = (uploaded || []).map((item: any) => item.url).filter(Boolean);

      setPhotos((current) => [...current, ...urls]);
    } catch (err: any) {
      setError(err?.message || "Could not upload those photos.");
    } finally {
      setUploading(false);
      try { (event.target as HTMLInputElement).value = ""; } catch {}
    }
  }

  async function addLog(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await financeRecordsApi.createLog(projectId, {
        ...form,
        workers: Number(form.workers || 0),
        labourCost: Number(form.labourCost || 0),
        materialCost: Number(form.materialCost || 0),
        photos,
      });

      setShowAdd(false);
      setForm(EMPTY);
      setPhotos([]);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not save that log.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLog(id: string) {
    if (!window.confirm("Remove this daily log?")) return;

    try {
      await financeRecordsApi.deleteLog(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not remove that log.");
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={addPhotos}
        aria-label="Add site photos"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </p>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={!canWrite}
          title={canWrite ? "" : "Subscribe to add logs"}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Log
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          Loading...
        </p>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <NotebookPen className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 text-sm text-slate-500">
            No daily logs yet. Record what happened on site today.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {new Date(log.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm text-slate-700">
                    {log.workDone}
                  </p>
                </div>

                <div className="flex items-center gap-5 text-right text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Workers</p>
                    <p className="font-semibold tabular-nums text-slate-900">{log.workers || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Labour</p>
                    <p className="font-semibold tabular-nums text-slate-900">{money(log.labourCost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Material</p>
                    <p className="font-semibold tabular-nums text-slate-900">{money(log.materialCost)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadReport(log)}
                    disabled={reportingId === log._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
                  >
                    <FileDown size={14} />
                    {reportingId === log._id ? "Building..." : "PDF Report"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeLog(log._id)}
                    disabled={!canWrite}
                    aria-label="Remove log"
                    className="text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {log.photos?.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {log.photos.slice(0, 5).map((photo: string, index: number) => (
                    <button
                      key={photo + index}
                      type="button"
                      onClick={() => openFile(photo)}
                      className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
                    >
                      <img src={photo} alt={`Site photo ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}

                  {log.photos.length > 5 && (
                    <span className="text-xs font-semibold text-slate-500">
                      +{log.photos.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {(log.notes || log.poNumber || log.mode) && (
                <p className="mt-3 text-xs text-slate-500">
                  {[log.mode, log.poNumber && `PO ${log.poNumber}`, log.notes]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-8">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />

          <form onSubmit={addLog} className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Add Daily Log</h3>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Workers on site
                  <input
                    type="number"
                    min="0"
                    value={form.workers}
                    onChange={(e) => setForm({ ...form, workers: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Work done
                <textarea
                  required
                  rows={3}
                  value={form.workDone}
                  onChange={(e) => setForm({ ...form, workDone: e.target.value })}
                  placeholder="e.g. False ceiling framing completed in living room"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Labour cost (₹)
                  <input
                    type="number"
                    min="0"
                    value={form.labourCost}
                    onChange={(e) => setForm({ ...form, labourCost: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Material cost (₹)
                  <input
                    type="number"
                    min="0"
                    value={form.materialCost}
                    onChange={(e) => setForm({ ...form, materialCost: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Mode
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  >
                    {MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  PO number
                  <input
                    value={form.poNumber}
                    onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Notes
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  <ImagePlus size={16} />
                  {uploading ? "Uploading..." : "Add site photos"}
                </button>

                {photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                      <div key={photo + index} className="relative">
                        <img
                          src={photo}
                          alt={`Selected ${index + 1}`}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                          aria-label="Remove photo"
                          className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-rose-500 shadow"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || uploading}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Log"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
