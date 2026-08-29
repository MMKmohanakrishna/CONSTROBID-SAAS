"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { financeApi } from "@/lib/api";
import ContractorSidebar from "@/components/contractor/ContractorSidebar";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function FinanceTrashPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [deleted, sub] = await Promise.all([
        financeApi.listProjects(true),
        financeApi.subscription(),
      ]);

      setProjects(deleted || []);
      setSubscription(sub);
    } catch (err: any) {
      setError(err?.message || "Could not load Trash.");
    } finally {
      setLoading(false);
    }
  }

  const canWrite = subscription?.canWrite !== false;

  async function restore(id: string) {
    try {
      setRestoringId(id);
      await financeApi.restoreProject(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not restore that project.");
    } finally {
      setRestoringId(null);
    }
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

          <div>
            <h1 className="text-2xl font-bold text-primary">Trash</h1>
            <p className="mt-1 text-sm text-slate-600">
              Deleted projects stay here with all their records. Restore one at any time — nothing is
              permanently removed.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!canWrite && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Read-only. Subscribe from Project Finance to restore projects again.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Trash2 className="mx-auto text-slate-300" size={38} />
                <p className="mt-3 font-semibold text-slate-700">Trash is empty</p>
                <p className="mt-1 text-sm text-slate-500">Deleted projects will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {projects.map((project: any) => (
                  <div
                    key={project._id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{project.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {project.clientName || "No client name"} · Deleted{" "}
                        {project.deletedAt
                          ? new Date(project.deletedAt).toLocaleDateString("en-IN")
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold tabular-nums text-slate-700">
                        {money(project.contractValue)}
                      </span>

                      <button
                        type="button"
                        onClick={() => restore(project._id)}
                        disabled={!canWrite || restoringId === project._id}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        {restoringId === project._id ? "Restoring..." : "Restore"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
