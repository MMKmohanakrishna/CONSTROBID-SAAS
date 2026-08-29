"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Wallet } from "lucide-react";
import { financeAdminApi } from "@/lib/api";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  trialing: "bg-blue-50 text-blue-700",
  expired: "bg-amber-50 text-amber-700",
};

export default function InspectorFinancePage() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setContractors((await financeAdminApi.contractors()) || []);
    } catch (err: any) {
      setError(err?.message || "Could not load contractor finances.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="w-full space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-primary">Contractor Finance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Every contractor using Project Finance, across ConstroBID jobs and their own work.
            Read-only.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Loading...</p>
          ) : contractors.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Wallet className="mx-auto text-slate-300" size={38} />
              <p className="mt-3 font-semibold text-slate-700">No contractor finance data yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Contractors appear here once they create their first finance project.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-semibold">Contractor</th>
                    <th className="px-5 py-3 font-semibold">Projects</th>
                    <th className="px-5 py-3 font-semibold">Contract value</th>
                    <th className="px-5 py-3 font-semibold">Subscription</th>
                    <th className="px-5 py-3 font-semibold">Last activity</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {contractors.map((row) => (
                    <tr key={row.contractorId} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link
                          href={`/inspection/finance/${row.contractorId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {row.companyName}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[row.phone, row.city].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold tabular-nums text-slate-900">
                          {row.projectCount}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {row.platformProjects} ConstroBID · {row.ownProjects} own
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">
                        {money(row.contractValue)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_STYLES[row.subscriptionStatus] || STATUS_STYLES.expired
                          }`}
                        >
                          {row.subscriptionStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {row.lastActivity
                          ? new Date(row.lastActivity).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Users size={14} />
          Site Diary notes are private to the contractor and are not shown here.
        </p>
      </div>
    </div>
  );
}
