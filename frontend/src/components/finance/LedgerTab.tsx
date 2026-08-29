"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Paperclip,
  IndianRupee,
} from "lucide-react";
import { financeLedgerApi } from "@/lib/api";

type Kind = "materials" | "labour";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const MODES = ["cash", "upi", "bank", "cheque"];

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
};

/** The two ledgers differ only in labels and the three fields either side owns. */
const CONFIG = {
  materials: {
    singular: "Material",
    addLabel: "Add Material",
    namePlaceholder: "e.g. Cement (50 bags)",
    emptyText: "No materials yet. Add one to start tracking spend.",
    fields: [
      { key: "quantity", label: "Quantity", placeholder: "500 sq ft" },
      { key: "supplier", label: "Supplier", placeholder: "Supplier name" },
      { key: "poNumber", label: "PO number", placeholder: "PO-1042" },
    ],
  },
  labour: {
    singular: "Labour",
    addLabel: "Add Labour",
    namePlaceholder: "e.g. Ravi's carpentry crew",
    emptyText: "No labour yet. Add a crew to start tracking spend.",
    fields: [
      { key: "trade", label: "Trade", placeholder: "Carpenter" },
      { key: "workers", label: "Workers", placeholder: "4", type: "number" },
      { key: "contact", label: "Contact", placeholder: "Phone number" },
    ],
  },
} as const;

interface Props {
  kind: Kind;
  projectId: string;
  canWrite: boolean;
  onChanged?: () => void;
}

export default function LedgerTab({ kind, projectId, canWrite, onChanged }: Props) {
  const config = CONFIG[kind];

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);
  const [editFor, setEditFor] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [addForm, setAddForm] = useState<any>({ name: "", budget: "", paid: "" });
  const [payForm, setPayForm] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    paidAdded: "",
    budgetAdded: "",
    mode: "cash",
    note: "",
  });

  const uploadTarget = useRef<{ entityType: string; entityId: string } | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (projectId) load();
  }, [projectId, kind]);

  async function load() {
    try {
      setLoading(true);
      setEntries((await financeLedgerApi.list(kind, projectId)) || []);
    } catch (err: any) {
      setError(err?.message || "Could not load this tab.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    await load();
    onChanged?.();
  }

  async function addEntry(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await financeLedgerApi.create(kind, projectId, {
        ...addForm,
        budget: Number(addForm.budget || 0),
        paid: Number(addForm.paid || 0),
      });

      setShowAdd(false);
      setAddForm({ name: "", budget: "", paid: "" });
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not add that entry.");
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !payFor) return;

    try {
      setBusy(true);
      setError("");

      await financeLedgerApi.addUpdate(kind, payFor._id, {
        ...payForm,
        paidAdded: Number(payForm.paidAdded || 0),
        budgetAdded: Number(payForm.budgetAdded || 0),
      });

      setPayFor(null);
      setPayForm({
        date: new Date().toISOString().slice(0, 10),
        paidAdded: "",
        budgetAdded: "",
        mode: "cash",
        note: "",
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not record that payment.");
    } finally {
      setBusy(false);
    }
  }

  function startEditing(entry: any) {
    const form: any = { name: entry.name, budget: String(entry.openingBudget ?? 0) };
    config.fields.forEach((field: any) => {
      form[field.key] = entry[field.key] ?? "";
    });

    setEditForm(form);
    setEditFor(entry);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !editFor) return;

    try {
      setBusy(true);
      setError("");

      await financeLedgerApi.update(kind, editFor._id, {
        ...editForm,
        budget: Number(editForm.budget || 0),
      });

      setEditFor(null);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not save those changes.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string) {
    if (!window.confirm(`Remove this ${config.singular.toLowerCase()} and its payment history?`)) return;

    try {
      await financeLedgerApi.remove(kind, id);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not remove that entry.");
    }
  }

  async function removePayment(entryId: string, updateId: string) {
    if (!window.confirm("Remove this payment? The totals will be recalculated.")) return;

    try {
      await financeLedgerApi.removeUpdate(kind, entryId, updateId);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not remove that payment.");
    }
  }

  function pickFile(entityType: string, entityId: string) {
    uploadTarget.current = { entityType, entityId };
    fileInput.current?.click();
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length || !uploadTarget.current) return;

    try {
      setBusy(true);

      const form = new FormData();
      files.forEach((file) => form.append("images", file));
      form.append("financeProjectId", projectId);
      form.append("entityType", uploadTarget.current.entityType);
      form.append("entityId", uploadTarget.current.entityId);

      await financeLedgerApi.attach(form);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Could not attach that file.");
    } finally {
      setBusy(false);
      uploadTarget.current = null;
      try { (event.target as HTMLInputElement).value = ""; } catch {}
    }
  }

  const totals = entries.reduce(
    (acc, entry) => ({
      budget: acc.budget + Number(entry.budget || 0),
      paid: acc.paid + Number(entry.paid || 0),
    }),
    { budget: 0, paid: 0 }
  );

  return (
    <div className="space-y-4">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        onChange={uploadFiles}
        aria-label="Attach invoice"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-5 text-sm">
          <span className="text-slate-500">
            Budget <b className="ml-1 tabular-nums text-slate-900">{money(totals.budget)}</b>
          </span>
          <span className="text-slate-500">
            Paid <b className="ml-1 tabular-nums text-primary">{money(totals.paid)}</b>
          </span>
          <span className="text-slate-500">
            Balance{" "}
            <b className="ml-1 tabular-nums text-slate-900">
              {money(Math.max(0, totals.budget - totals.paid))}
            </b>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={!canWrite}
          title={canWrite ? "" : `Subscribe to add ${config.singular.toLowerCase()}`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          {config.addLabel}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <IndianRupee className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-sm text-slate-500">{config.emptyText}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {entries.map((entry) => {
              const open = expanded === entry._id;
              const balance = Math.max(0, Number(entry.budget || 0) - Number(entry.paid || 0));

              return (
                <div key={entry._id}>
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : entry._id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {open ? (
                        <ChevronDown size={16} className="shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-slate-400" />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-900">{entry.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              STATUS_STYLES[entry.status] || STATUS_STYLES.pending
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {config.fields
                            .map((field) => entry[field.key])
                            .filter(Boolean)
                            .join(" · ") || "No details"}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-5 text-right text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Budget</p>
                        <p className="font-semibold tabular-nums text-slate-900">{money(entry.budget)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Paid</p>
                        <p className="font-semibold tabular-nums text-primary">{money(entry.paid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Balance</p>
                        <p className="font-semibold tabular-nums text-slate-900">{money(balance)}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPayFor(entry)}
                        disabled={!canWrite}
                        className="rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Update
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditing(entry)}
                        disabled={!canWrite}
                        aria-label="Edit details"
                        title="Edit details"
                        className="text-slate-400 transition hover:text-primary disabled:opacity-40"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeEntry(entry._id)}
                        disabled={!canWrite}
                        aria-label="Remove"
                        className="text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Payment history
                        </h4>

                        <button
                          type="button"
                          onClick={() => pickFile(kind === "materials" ? "material" : "labour", entry._id)}
                          disabled={!canWrite || busy}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary disabled:opacity-50"
                        >
                          <Paperclip size={13} />
                          Attach file
                        </button>
                      </div>

                      {entry.files?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {entry.files.map((file: any) => (
                            <a
                              key={file._id}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary"
                            >
                              {file.fileName}
                            </a>
                          ))}
                        </div>
                      )}

                      {entry.updates?.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No payments recorded yet. Use Update to log one.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {entry.updates.map((update: any) => (
                            <div
                              key={update._id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {update.paidAdded > 0 && `Paid ${money(update.paidAdded)}`}
                                  {update.paidAdded > 0 && update.budgetAdded > 0 && " · "}
                                  {update.budgetAdded > 0 && `Budget +${money(update.budgetAdded)}`}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {new Date(update.date).toLocaleDateString("en-IN")}
                                  {update.mode ? ` · ${update.mode}` : ""}
                                  {update.note ? ` · ${update.note}` : ""}
                                </p>

                                {update.files?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {update.files.map((file: any) => (
                                      <a
                                        key={file._id}
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700"
                                      >
                                        {file.fileName}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    pickFile(
                                      kind === "materials" ? "material_update" : "labour_update",
                                      update._id
                                    )
                                  }
                                  disabled={!canWrite || busy}
                                  aria-label="Attach invoice"
                                  className="text-slate-400 transition hover:text-primary disabled:opacity-40"
                                >
                                  <Paperclip size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removePayment(entry._id, update._id)}
                                  disabled={!canWrite}
                                  aria-label="Remove payment"
                                  className="text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />

          <form onSubmit={addEntry} className="relative z-10 my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">{config.addLabel}</h3>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-600">
                Name
                <input
                  autoFocus
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder={config.namePlaceholder}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                {config.fields.map((field: any) => (
                  <label key={field.key} className="block text-sm font-medium text-slate-600">
                    {field.label}
                    <input
                      type={field.type || "text"}
                      value={addForm[field.key] || ""}
                      onChange={(e) => setAddForm({ ...addForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Budget (₹)
                  <input
                    type="number"
                    min="0"
                    value={addForm.budget}
                    onChange={(e) => setAddForm({ ...addForm, budget: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Already paid (₹)
                  <input
                    type="number"
                    min="0"
                    value={addForm.paid}
                    onChange={(e) => setAddForm({ ...addForm, paid: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>
              </div>

              <p className="text-xs text-slate-500">
                Anything already paid is recorded as the first entry in the payment history.
              </p>
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
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Adding..." : config.addLabel}
              </button>
            </div>
          </form>
        </div>
      )}

      {editFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setEditFor(null)}
          />

          <form onSubmit={saveEdit} className="relative z-10 my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Edit {config.singular}</h3>
              <button type="button" onClick={() => setEditFor(null)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-600">
                Name
                <input
                  autoFocus
                  required
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                {config.fields.map((field: any) => (
                  <label key={field.key} className="block text-sm font-medium text-slate-600">
                    {field.label}
                    <input
                      type={field.type || "text"}
                      value={editForm[field.key] ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Opening budget (₹)
                <input
                  type="number"
                  min="0"
                  value={editForm.budget ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                />
              </label>

              <p className="text-xs text-slate-500">
                This is the budget you started with. Extra budget added through payments stays on the
                history and is added on top — the row currently shows {money(editFor.budget)} in total.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditFor(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {payFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setPayFor(null)}
          />

          <form onSubmit={addPayment} className="relative z-10 my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Record a payment</h3>
              <button type="button" onClick={() => setPayFor(null)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-500">{payFor.name}</p>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Amount paid (₹)
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    value={payForm.paidAdded}
                    onChange={(e) => setPayForm({ ...payForm, paidAdded: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Extra budget (₹)
                  <input
                    type="number"
                    min="0"
                    value={payForm.budgetAdded}
                    onChange={(e) => setPayForm({ ...payForm, budgetAdded: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  Date
                  <input
                    type="date"
                    value={payForm.date}
                    onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-600">
                  Mode
                  <select
                    value={payForm.mode}
                    onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                  >
                    {MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Note
                <input
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  placeholder="e.g. Advance against delivery"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayFor(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
