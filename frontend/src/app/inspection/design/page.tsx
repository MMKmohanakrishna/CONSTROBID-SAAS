'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/api';
import {
  FileText,
  Images,
  Eye,
} from "lucide-react";

export default function DesignList() {
  const [scheduledProjects, setScheduledProjects] = useState<any[]>([]);
const [completedProjects, setCompletedProjects] = useState<any[]>([]);
const [confirmedProjects, setConfirmedProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
  'scheduled' | 'completed' | 'confirmed'
>('scheduled');

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
  try {
    const json = await apiRequest('/inspection/design/dashboard');

    setScheduledProjects(json.scheduled || []);
    setCompletedProjects(json.completed || []);
    setConfirmedProjects(json.confirmed || []);
  } catch (error) {
    console.error(error);
  }
};

const activeProjects =
  activeTab === "scheduled"
    ? scheduledProjects
    : activeTab === "completed"
    ? completedProjects
    : confirmedProjects;

  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30">
        <div className="flex items-start justify-between">
  <div>
    <h2 className="text-3xl font-bold text-[var(--primary)]">
      Design Management
    </h2>

    <p className="text-gray-500 mt-2">
      Manage inspection projects and client approved designs.
    </p>

    <div className="mt-6 flex gap-3">
      <button
        onClick={() => setActiveTab("scheduled")}
        className={`px-5 py-2 rounded-xl font-semibold transition ${
          activeTab === "scheduled"
            ? "bg-[#70153a] text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        Inspection Scheduled
      </button>

      <button
        onClick={() => setActiveTab("completed")}
        className={`px-5 py-2 rounded-xl font-semibold transition ${
          activeTab === "completed"
            ? "bg-[#70153a] text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        Inspection Completed
      </button>

      <button
        onClick={() => setActiveTab("confirmed")}
        className={`px-5 py-2 rounded-xl font-semibold transition ${
          activeTab === "confirmed"
            ? "bg-[#70153a] text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        Design Confirmed
      </button>
    </div>
  </div>
</div>

<div className="mt-8">
  {activeProjects.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
      <h3 className="text-lg font-semibold text-gray-700">
        No Projects Found
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        There are no projects available in this section.
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      {activeProjects.map((project: any) => (
  <React.Fragment key={project._id}>

    {activeTab === "scheduled" && (
       <motion.div
  whileHover={{ y: -5 }}
  transition={{ duration: 0.2 }}
  className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300"
>
  {/* Header */}
  <div className="flex items-start justify-between">

    <div>

      <h2 className="text-xl font-bold text-[#70153a]">
        {project.title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {project.category}
      </p>

    </div>

    <span className="rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-semibold text-yellow-700">
      Scheduled
    </span>

  </div>

  {/* Information */}

  <div className="mt-8">

    <div className="grid grid-cols-3 gap-6">

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Budget
        </p>

        <p className="mt-2 text-lg font-semibold text-green-600">
          ₹
{project.budget
  ? project.budget.toLocaleString("en-IN")
  : "-"}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Area
        </p>

        <p className="mt-2 text-lg font-semibold text-gray-800">
          {project.squareFeet?.toLocaleString() || "-"} sq.ft
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          City
        </p>

        <p className="mt-2 text-lg font-semibold text-gray-800">
          {project.city || "-"}
        </p>
      </div>

    </div>

    <div className="grid grid-cols-2 gap-6 mt-6">

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Client
        </p>

        <p className="mt-2 text-lg font-semibold text-gray-800">
          {project.clientId?.name || "-"}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Inspection Date
        </p>

        <p className="mt-2 text-lg font-semibold text-gray-800">
          {project.inspectionDate
            ? new Date(project.inspectionDate).toLocaleDateString()
            : "-"}
        </p>
      </div>

    </div>

  </div>

  {/* Divider */}

  <div className="my-6 border-t border-gray-200"></div>

  {/* Button */}

  <Link
    href={`/inspection/project/${project._id}`}
   className="flex h-12 w-full items-center justify-center rounded-xl bg-[#70153a] text-sm font-semibold text-white transition hover:bg-[#5d1231]"
  >
    View Details
  </Link>

</motion.div>
)}
{activeTab === "completed" && (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2 }}
    className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    {/* Header */}
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-xl font-bold text-[#70153a]">
          {project.title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {project.category}
        </p>
      </div>

      <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold text-blue-700">
        Inspection Completed
      </span>
    </div>

    {/* Information */}
    <div className="mt-8">
      <div className="grid grid-cols-3 gap-6">

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Budget
    </p>

    <p className="mt-2 text-lg font-semibold text-green-600">
      ₹ {project.budget ? project.budget.toLocaleString("en-IN") : "-"}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Area
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.squareFeet?.toLocaleString() || "-"} sq.ft
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      City
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.city || "-"}
    </p>
  </div>

</div>

<div className="grid grid-cols-2 gap-6 mt-6">

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Client
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.clientId?.name || "-"}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Completed Date
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.inspectionCompletedAt
        ? new Date(project.inspectionCompletedAt).toLocaleDateString()
        : "-"}
    </p>
  </div>

</div>
    </div>

    <div className="my-6 border-t border-gray-200"></div>

    <div className="grid grid-cols-3 gap-3">

  <Link
    href={`/inspection/project/${project._id}`}
    className="flex items-center justify-center gap-2 rounded-xl bg-[#70153a] py-3 text-sm font-semibold text-white transition hover:bg-[#5d1231]"
  >
    <Eye size={18} />
    View Details
  </Link>

</div>
  </motion.div>
)}
{activeTab === "confirmed" && (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2 }}
    className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    {/* Header */}
    <div className="flex items-start justify-between">

      <div>
        <h2 className="text-xl font-bold text-[#70153a]">
          {project.title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {project.category}
        </p>
      </div>

      <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-semibold text-green-700">
        Design Confirmed
      </span>

    </div>

    {/* Information */}

    <div className="mt-8">

      <div className="grid grid-cols-3 gap-6">

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Budget
    </p>

    <p className="mt-2 text-lg font-semibold text-green-600">
      ₹ {project.budget ? project.budget.toLocaleString("en-IN") : "-"}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Area
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.squareFeet?.toLocaleString() || "-"} sq.ft
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      City
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.city || "-"}
    </p>
  </div>

</div>

<div className="grid grid-cols-2 gap-6 mt-6">

  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      Client
    </p>

    <p className="mt-2 text-lg font-semibold text-gray-800">
      {project.clientId?.name || "-"}
    </p>
  </div>

</div>
    </div>

    <div className="my-6 border-t border-gray-200"></div>

    <Link
      href={`/inspection/project/${project._id}`}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-[#70153a] text-sm font-semibold text-white transition hover:bg-[#5d1231]"
    >
      View Design
    </Link>

  </motion.div>
)}
  </React.Fragment>
))}
    </div>
  )}
</div>
      </div>
    </div>
  );
}
