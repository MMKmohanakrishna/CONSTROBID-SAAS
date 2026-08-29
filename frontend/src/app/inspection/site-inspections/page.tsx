'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

/**
 * Filters map to the real inspectionStatus enum on InspectionReport. The
 * previous labels ("Pending Inspection", "Inspection Completed") matched
 * nothing in the data.
 */
const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

/** The project a report belongs to, whether populated or a bare id. */
function projectKey(report: any) {
  const project = report?.projectId;
  return typeof project === 'object' ? String(project?._id || '') : String(project || '');
}

function reportTime(report: any) {
  return new Date(report?.inspectionDate || report?.createdAt || 0).getTime();
}

export default function SiteInspectionsList() {
  const { loading } = useAuth();

  const [list, setList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    if (!loading) fetchList();
  }, [loading]);

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const json = await apiRequest('/inspection/site-inspections');
      setList(json || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  /**
   * One card per project, showing its most recent inspection. Re-scheduling a
   * project creates another report, which previously made the same project
   * appear twice with contradicting statuses.
   */
  const latestPerProject = useMemo(() => {
    const newest = new Map<string, any>();

    (list || []).forEach((report) => {
      const key = projectKey(report) || String(report?._id);
      const existing = newest.get(key);

      if (!existing || reportTime(report) > reportTime(existing)) {
        newest.set(key, report);
      }
    });

    return [...newest.values()].sort((a, b) => reportTime(b) - reportTime(a));
  }, [list]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return latestPerProject.filter((it) => {
      if (status !== 'ALL' && String(it.inspectionStatus || '') !== status) return false;
      if (!term) return true;

      const haystack = [
        it.projectId?.title,
        it.projectId?.city,
        it.city,
        projectKey(it),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [latestPerProject, search, status]);

  return (
  <div className="min-h-screen">
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">
            Inspection &amp; Reports
          </h1>

          <p className="mt-2 text-gray-600">
            Manage all assigned inspections, monitor project progress,
            and generate professional inspection reports.
          </p>
        </div>

        <Link
          href="/inspection/site-inspections/create"
          className="rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          + New Inspection
        </Link>
      </div>

      {/* Search */}

      <div className="mt-8">

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project, city or project ID..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[var(--primary)]"
        />

      </div>

      {/* Filters */}

      <div className="mt-6 flex flex-wrap gap-3">

        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-gray-300 bg-white hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {filter.label}
            </button>
          );
        })}

      </div>

      {/* Existing List */}

      <div className="mt-8">

        {loadingList ? (

          <div className="py-20 text-center">
            Loading...
          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

    {visible.length === 0 && (

        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">

            <div className="text-5xl">📋</div>

            <h3 className="mt-4 text-xl font-semibold">
                No Inspections Found
            </h3>

            <p className="mt-2 text-gray-500">
                {list.length === 0
                  ? 'No inspections have been created yet.'
                  : 'There are no inspections matching your filters.'}
            </p>

        </div>

    )}

    {visible.map((it) => (

        <div
            key={it._id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-xl"
        >


            {/* Card Content */}

            <div className="flex items-start justify-between gap-3">

    <div className="min-w-0">

        <h3 className="text-lg font-bold text-gray-900">
  {it.projectId?.title || "Unlinked Project"}
</h3>

        <p className="mt-1 text-sm text-gray-500">

            {it.projectId?.city || it.city || "Location not available"}

        </p>

    </div>

    <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[String(it.inspectionStatus)] || 'bg-slate-100 text-slate-700'
        }`}
    >

        {it.inspectionStatus}

    </span>

</div>
<div className="mt-6 space-y-3 text-sm">

    <div className="flex justify-between">
        <span className="text-gray-500">
            Inspection Date
        </span>

        <span className="font-medium">
            {new Date(
                it.inspectionDate || it.createdAt
            ).toLocaleDateString()}
        </span>
    </div>

    <div className="flex justify-between">
        <span className="text-gray-500">
            City
        </span>

        <span className="font-medium">
            {it.projectId?.city || it.city || "-"}
        </span>
    </div>

</div>
<div className="mt-8">

    <Link
        href={`/inspection/site-inspections/${it._id}`}
        className="block w-full rounded-xl bg-[var(--primary)] py-3 text-center font-semibold text-white hover:opacity-90"
    >
        View Details
    </Link>

</div>

        </div>

    ))}

</div>

        )}

      </div>

    </div>
  </div>
  );
}
