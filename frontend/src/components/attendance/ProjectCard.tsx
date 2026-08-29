"use client";

import { motion } from "framer-motion";

interface ProjectCardProps {
  project: {
    title: string;
    id: string;
    address?: string;
    city?: string;
    status?: string;
    startDate?: string;
    contractorName?: string;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Attendance History</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{project.title}</h1>
          <p className="mt-2 text-sm text-slate-500">Project ID: {project.id}</p>
        </div>

        <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-inner">
          <p className="font-semibold">Contractor</p>
          <p className="mt-1 text-slate-600">{project.contractorName || 'Unassigned'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.address || 'N/A'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.status || 'N/A'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Start Date</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBA'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Project City</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{project.city || 'N/A'}</p>
        </div>
      </div>
    </motion.div>
  );
}
