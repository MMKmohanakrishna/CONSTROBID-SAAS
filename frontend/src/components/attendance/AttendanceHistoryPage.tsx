"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { attendanceApi, projectApi } from "@/lib/api";
import { exportAttendanceCsv, exportAttendanceExcel, exportAttendancePdf } from "@/lib/export-utils";
import ProjectCard from "@/components/attendance/ProjectCard";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceFilters, { AttendanceFiltersState } from "@/components/attendance/AttendanceFilters";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import Pagination from "@/components/attendance/Pagination";

interface AttendanceHistoryPageProps {
  projectId: string;
  backHref: string;
}

const defaultFilters: AttendanceFiltersState = {
  from: '',
  status: '',
};

export default function AttendanceHistoryPage({ projectId, backHref }: AttendanceHistoryPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ presentDays: 0, absentDays: 0, halfDays: 0, leaveDays: 0, totalWorkingHours: 0 });
  const [filters, setFilters] = useState<AttendanceFiltersState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const projectData = await projectApi.getById(projectId);
      setProject(projectData.project || projectData);
    } catch (error: any) {
      console.error('Project load failed', error);
      setError(error.message || 'Failed to load project details.');
    }
  }, [projectId]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
  ...(filters.from ? { from: filters.from } : {}),
  ...(filters.status ? { status: filters.status } : {}),
  page: String(page),
  limit: String(limit),
};

      const response: any = await attendanceApi.getProjectAttendance(projectId, params);
      if (!response) {
        throw new Error('Empty attendance response from server');
      }
      if (response.success === false) {
        throw new Error(response.message || 'Unable to load attendance.');
      }
      setProject(response.project || project);
      setAttendanceRecords(response.attendance || []);
      setSummary(response.summary || { presentDays: 0, absentDays: 0, halfDays: 0, leaveDays: 0, totalWorkingHours: 0 });
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Attendance load failed', error);
      setError(error.message || 'Failed to load attendance history.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, projectId]);

  useEffect(() => {
    loadProject();
    loadAttendance();
  }, [loadProject, loadAttendance]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.type === 'LOCAL_MUTATION_COMPLETED') {
        loadAttendance();
      }
    };
    window.addEventListener('constrobid:data-changed', handler as EventListener);
    return () => window.removeEventListener('constrobid:data-changed', handler as EventListener);
  }, [loadAttendance]);

  const handleApply = () => {
    setPage(1);
    loadAttendance();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const memoizedProject = useMemo(() => ({
    title: project?.title || 'Project',
    id: project?._id || project?.id || project?.projectId || 'N/A',
    address: project?.address || project?.city || 'N/A',
    city: project?.city || 'N/A',
    status: project?.status || 'N/A',
    startDate: project?.createdAt || project?.startDate || '',
    contractorName: project?.contractorName || project?.selectedContractor?.name || project?.contractorId?.name || 'Unassigned',
  }), [project]);

  const handleExportCsv = async () => {
    setSaving(true);
    try {
      await exportAttendanceCsv(attendanceRecords, memoizedProject.title);
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    setSaving(true);
    try {
      await exportAttendanceExcel(attendanceRecords, memoizedProject.title);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    setSaving(true);
    try {
      await exportAttendancePdf(attendanceRecords, memoizedProject.title);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 p-8 lg:p-12">
      {/* Header */}

<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

  {/* Back Button */}

  <button
    onClick={() => router.push(backHref)}
    className="
      inline-flex
      items-center
      gap-2
      rounded-2xl
      border
      border-slate-200
      bg-white
      px-5
      py-4
      text-lg
      font-medium
      text-slate-700
      shadow-sm
      hover:bg-slate-50
      transition-all
    "
  >
    <ArrowLeft size={22} />
    Back
  </button>

  {/* Heading */}

  <div className="text-right">

    <p
      className="
        text-sm
        uppercase
        tracking-[0.35em]
        text-slate-400
      "
    >
      Attendance History
    </p>

    <h1
      className="
        mt-2
        text-5xl
        font-bold
        text-primary
      "
    >
      Project Attendance Details
    </h1>

  </div>

</div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <strong className="block font-semibold">Unable to load attendance data</strong>
          <p className="mt-2">{error}</p>
        </div>
      ) : null}

      <AnimatePresence>
        <motion.div layout className="grid gap-6">
          <ProjectCard project={memoizedProject} />
          <AttendanceSummary {...summary} />
          <AttendanceFilters
            filters={filters}
            onChange={setFilters}
            onApply={handleApply}
            onReset={handleReset}
            onExportCsv={handleExportCsv}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            loading={saving || loading}
          />
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-400" />
              <p className="mt-4 text-sm">Loading attendance records…</p>
            </div>
          ) : (
            <AttendanceTable records={attendanceRecords} />
          )}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
