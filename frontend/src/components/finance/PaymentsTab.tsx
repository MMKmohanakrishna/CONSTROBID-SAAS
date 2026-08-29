"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2, Wallet } from "lucide-react";
import { financeRecordsApi } from "@/lib/api";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const MODES = ["cash", "upi", "bank", "cheque"];

export default function PaymentsTab({
  projectId,
  canWrite,
  onChanged,
}: {
  projectId: string;
  canWrite: boolean;
  onChanged?: () => void;
}) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    mode: "bank",
    note: "",
  });

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setPayments((await financeRecordsApi.listPayments(projectId)) || []);
    } catch (err: any) {
      setError(err?.message || "Could not load payments.");
    } finally {
      setLoading(false);
    }
  }

  async function addPayment(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    try {
      setBusy(true);
      setError("");

      await financeRecordsApi.createPayment(projectId, {
        ...form,
        amount: Number(form.amount || 0),
      });

      setShowAdd(false);
      setForm({ date: new Date().toISOString().slice(0, 10), amount: "", mode: "bank", note: "" });
      await load();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || "Could not record that payment.");
    } finally {
      setBusy(false);
    }
  }

  async function removePayment(id: string) {
    if (!window.confirm("Remove this payment?")) return;

    try {
      await financeRecordsApi.deletePayment(id);
      await load();
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || "Could not remove that payment.");
    }
  }

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Total received <b className="ml-1 tabular-nums text-primary">{money(total)}</b>
        </p>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={!canWrite}
          title={canWrite ? "" : "Subscribe to record payments"}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Record Payment
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
        ) : payments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Wallet className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-sm text-slate-500">
              No payments recorded yet. Add what the client has paid you so far.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold tabular-nums text-slate-900">{money(payment.amount)}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {new Date(payment.date).toLocaleDateString("en-IN")}
                    {payment.mode ? ` · ${payment.mode}` : ""}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removePayment(payment._id)}
                  disabled={!canWrite}
                  aria-label="Remove payment"
                  className="text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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

          <form onSubmit={addPayment} className="relative z-10 my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">Record Payment</h3>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-600">
                Amount received (₹)
                <input
                  autoFocus
                  required
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 tabular-nums outline-none focus:border-primary"
                />
              </label>

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
              </div>

              <label className="block text-sm font-medium text-slate-600">
                Note
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Second milestone"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
                />
              </label>
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
                {busy ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
