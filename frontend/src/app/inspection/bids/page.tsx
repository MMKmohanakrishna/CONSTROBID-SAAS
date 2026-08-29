'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProjectQuotationCard from "@/components/inspection/ProjectQuotationCard";
import {
  Search,
  ChevronDown,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  CircleOff,
  PencilLine,
} from "lucide-react";
import { projectApi } from "@/lib/api";

export default function VerifyBidQuotesPage() {
  const [searchProject, setSearchProject] = useState('');
  const [searchContractor, setSearchContractor] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Newest First');

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    loadQuotationSummary();
}, []);

const loadQuotationSummary = async () => {
    try {
        setLoading(true);

        const data = await projectApi.getQuotationSummary();

console.log("Quotation Summary:", data);

setProjects(data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
};

  // A project is as recent as its most recently submitted quotation.
  const latestQuoteTime = (project: any) =>
    (project?.quotations || []).reduce((latest: number, quote: any) => {
      const time = new Date(quote?.createdAt || 0).getTime();
      return Number.isNaN(time) ? latest : Math.max(latest, time);
    }, 0);

  const filteredProjects = useMemo(() => {
    const list = [...projects];

    switch (sortBy) {
      case "Oldest First":
        return list.sort((a, b) => latestQuoteTime(a) - latestQuoteTime(b));
      case "Lowest Amount":
        return list.sort((a, b) => Number(a.lowestQuote || 0) - Number(b.lowestQuote || 0));
      case "Highest Amount":
        return list.sort((a, b) => Number(b.highestQuote || 0) - Number(a.highestQuote || 0));
      default:
        return list.sort((a, b) => latestQuoteTime(b) - latestQuoteTime(a));
    }
  }, [projects, sortBy]);

const verificationStats = useMemo(() => {
  return [
    {
      label: "Pending Verification",
      value: projects.filter(
        (p) => p.pendingQuotes > 0
      ).length,
      description: "Projects Awaiting Review",
      cardBg: "bg-amber-50",
      textColor: "text-amber-700",
      icon: ClipboardCheck,
      iconBg: "bg-amber-100",
    },

    {
      label: "Verified",
      value: projects.filter(
        (p) => p.verifiedQuotes > 0
      ).length,
      description: "Projects With Verified Quotes",
      cardBg: "bg-green-50",
      textColor: "text-green-700",
      icon: CheckCircle2,
      iconBg: "bg-green-100",
    },

    {
      label: "Rejected",
      value: projects.filter(
        (p) => p.rejectedQuotes > 0
      ).length,
      description: "Projects With Rejected Quotes",
      cardBg: "bg-red-50",
      textColor: "text-red-700",
      icon: CircleOff,
      iconBg: "bg-red-100",
    },

    {
      label: "Total Projects",
      value: projects.length,
      description: "Projects Loaded",
      cardBg: "bg-purple-50",
      textColor: "text-purple-700",
      icon: PencilLine,
      iconBg: "bg-purple-100",
    },
  ];
}, [projects]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1380px] mx-auto px-6">
        <div className="rounded-[32px] bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] border border-gray-100">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-primary">Verify Bid Quotations</h1>
              <p className="max-w-2xl text-sm text-slate-600">Review contractor quotations before they become visible to the client.</p>
            </div>
            
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {verificationStats.map((stat) => {
              const Icon = stat.icon;

              return (
              <div key={stat.label} className={`h-40 rounded-2xl border ${stat.cardBg} ${stat.textColor} p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}>
                <div className="flex h-full justify-between">

  {/* Left */}
  <div className="flex flex-col justify-between">

    <div>

      <p className={`text-sm font-semibold ${stat.textColor}`}>
        {stat.label}
      </p>

      <h2 className={`mt-5 text-5xl font-extrabold leading-none ${stat.textColor}`}>
        {stat.value}
      </h2>

    </div>

    <p className="text-sm text-slate-500 leading-relaxed">
      {stat.description}
    </p>

  </div>

  {/* Right */}
  <div
    className={`
      h-14
      w-14
      rounded-2xl
      ${stat.iconBg}
      flex
      items-center
      justify-center
      shadow-sm
    `}
  >
    <Icon
      size={28}
      strokeWidth={2.2}
      className={stat.textColor}
    />
  </div>

</div>
              </div>
              );
            })}
          </div>    

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[2fr_2fr_1fr_1fr_auto]">
              <label className="relative block">
                <span className="sr-only">Search Project</span>
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400"><Search size={16} /></span>
                <input
                  value={searchProject}
                  onChange={(e) => setSearchProject(e.target.value)}
                  placeholder="Search by project name..."
                  className="w-full rounded-3xl border border-transparent bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Search Contractor</span>
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400"><Search size={16} /></span>
                <input
                  value={searchContractor}
                  onChange={(e) => setSearchContractor(e.target.value)}
                  placeholder="Search by contractor..."
                  className="w-full rounded-3xl border border-transparent bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-3xl border border-transparent bg-white/90 py-3 px-4 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option>All Statuses</option>
                  <option>Pending Verification</option>
                  <option>Verified</option>
                  <option>Rejected</option>
                  <option>Revision Requested</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </label>

              <label className="relative block">
                <span className="sr-only">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-3xl border border-transparent bg-white/90 py-3 px-4 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Lowest Amount</option>
                  <option>Highest Amount</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </label>

              <button className="inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow hover:bg-primary-dark transition">
                Filter
              </button>
            </div>
          </div>


          <div className="mt-8 border-t border-slate-200 pt-5">

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
{filteredProjects.map((project) => (
  <ProjectQuotationCard
    key={project.projectId}
    project={project}
  />
))}
  </div>
</div>
          </div>
        </div>
      </div>
  );
}
