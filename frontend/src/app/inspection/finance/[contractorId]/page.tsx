"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building } from "lucide-react";
import { financeAdminApi } from "@/lib/api";

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function InspectorContractorFinancePage() {
  const { contractorId } = useParams();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contractorId) load();
  }, [contractorId]);

  async function load() {
    try {
      setLoading(true);
      setData(await financeAdminApi.contractor(String(contractorId)));
    } catch (err: any) {
      setError(err?.message || "Could not load this contractor.");
    } finally {
      setLoading(false);
    }
  }

  const contractor = data?.contractor;
  const projects = data?.projects || [];

  const totals = projects.reduce(
    (acc: any, project: any) => ({
      contractValue: acc.contractValue + Number(project.contractValue || 0),
      spent: acc.spent + Number(project.spent || 0),
      received: acc.received + Number(project.received || 0),
    }),
    { contractValue: 0, spent: 0, received: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="w-full space-y-6">

        <button
          type="button"
          onClick={() => router.push("/inspection/finance")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          All contractors
        </button>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : !contractor ? (
          <p className="text-sm text-slate-500">Contractor not found.</p>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-primary">
                {contractor.companyName || contractor.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {[contractor.phone, contractor.city].filter(Boolean).join(" · ") || "—"} ·
                Subscription: <b className="text-slate-700">{contractor.subscriptionStatus}</b>
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Contract value", value: money(totals.contractValue) },
                  { label: "Spent", value: money(totals.spent) },
                  { label: "Received", value: money(totals.received) },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-primary">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-bold text-primary">Projects</h2>
              </div>

              {projects.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Building className="mx-auto text-slate-300" size={36} />
                  <p className="mt-3 text-sm text-slate-500">No finance projects yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projects.map((project: any) => (
                    <Link
                      key={project._id}
                      href={`/inspection/finance/project/${project._id}`}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                    >
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

                      <div className="flex items-center gap-6 text-right text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Contract</p>
                          <p className="font-semibold tabular-nums text-slate-900">
                            {money(project.contractValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Spent</p>
                          <p className="font-semibold tabular-nums text-slate-900">
                            {money(project.spent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Profit</p>
                          <p
                            className={`font-semibold tabular-nums ${
                              project.grossProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {money(project.grossProfit)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
