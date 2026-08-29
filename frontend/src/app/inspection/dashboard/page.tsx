'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/inspection/Sidebar';
import Link from 'next/link';
import { 
  Building, 
  FileSpreadsheet, 
  MapPin, 
  Activity, 
  Clock, 
  Layout, 
  CheckCircle2, 
  Eye, 
  X, 
  Filter,
  IndianRupee,
  Building2,
  Clock3,
  CheckCircle,
  FolderCheck,
  Ban,
  PlusCircle,
  ClipboardList, 
  AlertTriangle,
  Upload,
  User,
  ArrowRight,
  ShieldAlert,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, projectApi, commonApi } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useRealtimeRefresh } from '@/components/RealtimeSyncProvider';
import DateTimePickerModal from '@/components/common/DateTimePickerModal';

export default function InspectionDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const { setNotification } = useNotification();
  const router = useRouter();

  const [projects, setProjects] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
  // Mirrors selectedProject so async refreshes can read it without stale closures.
  const selectedProjectRef = useRef<any>(null);
  const [scheduledProjects, setScheduledProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'inspections' | 'designs' | 'bids' | 'disputes'>('overview');

  // Form input states
  const [scheduleDate, setScheduleDate] = useState('');

  // Reopen-bidding modal (stalled projects with zero usable bids)
  const [reopenProjectId, setReopenProjectId] = useState<string | null>(null);
  const [reopenDate, setReopenDate] = useState('');
  const [reopenTime, setReopenTime] = useState('');

  const submitReopenBidding = async () => {
    if (!reopenProjectId || !reopenDate || !reopenTime) return;
    try {
      const deadline = new Date(`${reopenDate}T${reopenTime}:00`);
      await projectApi.reopenBidding(reopenProjectId, deadline.toISOString());
      setReopenProjectId(null);
      setReopenDate('');
      setReopenTime('');
      setNotification({ type: 'success', message: 'Bidding reopened for this project.' });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Failed to reopen bidding' });
    }
  };

  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  
  const [designUrl, setDesignUrl] = useState('');

  // Site visits states
  const [visitType, setVisitType] = useState('VISIT');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitPhoto, setVisitPhoto] = useState('');

  // Dispute resolution states
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'INSPECTOR' && user.role !== 'INSPECTION_TEAM'))) {
      router.push('/auth/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  // Live refresh: re-fetch silently whenever the backend broadcasts a project change
  // (e.g. a client uploading a new project), so it appears without a manual reload.
  useRealtimeRefresh(() => {
    if (!user) return;
    fetchData({ silent: true });
  });

  const fetchData = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    try {
      const allProjects = await projectApi.list();
      console.log("TOTAL PROJECTS:", allProjects.length);
console.log("PROJECTS:", allProjects);
      console.log("========== PROJECTS ==========");

console.table(
  allProjects.map((p: any) => ({
    title: p.title,
    status: p.status,
    clientApproved: p.clientApproved,
    inspectorApproved: p.inspectorApproved,
  }))
);
      console.log("ALL PROJECTS:", allProjects);
      console.log("Projects:", allProjects);
      setProjects(allProjects);
      console.table(
  allProjects.map((p: any) => ({
    title: p.title,
    status: p.status,
  }))
);
      const scheduled = allProjects.filter(
        (p: any) => p.status === 'INSPECTION_SCHEDULED'
      );

      setScheduledProjects(scheduled);

      // Fetch all contractors (total registered)
      const contractorsResponse = await apiRequest('/inspection/contractors');
      setContractors(contractorsResponse || []);

      const dashboardData = await apiRequest('/inspection/dashboard');
      setRevenueStats(dashboardData);

      if (allProjects.length > 0) {
        // Keep the inspector's current selection on silent refreshes; only
        // fall back to the first project when nothing is selected yet.
        const current = selectedProjectRef.current;
        const targetId =
          current?._id || current?.id || allProjects[0]._id || allProjects[0].id;

        const detailed = await projectApi.getById(targetId);
        setSelectedProject(detailed);
      }
    } catch (err) {
      console.error('Inspection fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSelectProject = async (proj: any) => {
    try {
      const detailed = await projectApi.getById(
        proj._id || proj.id
      );
      setSelectedProject(detailed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyContractor = async (
  contractorId: string,
  status: 'VERIFIED' | 'REJECTED'
) => {
  try {
    const action =
      status === 'VERIFIED'
        ? 'approve'
        : 'reject';

    await apiRequest(
      `/inspection/contractors/${contractorId}/${action}`,
      {
        method: 'POST'
      }
    );

    await fetchData();

    setNotification({
      type: 'success',
      message: `Contractor ${status.toLowerCase()} successfully`
    });
  } catch (err: any) {
    setNotification({
      type: 'error',
      message: err.message
    });
  }
};

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await projectApi.scheduleInspection(selectedProject._id || selectedProject.id, scheduleDate);
      setScheduleDate('');
      await handleSelectProject(selectedProject);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Site visit inspection scheduled successfully.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleCompleteReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      // Find the pending report
      const activeReport = selectedProject.inspectionReports.find((r: any) => !r.completedDate);
      if (!activeReport) throw new Error('No active scheduled report found.');

      const mJson = measurements ? { details: measurements } : {};

      await projectApi.submitReport(selectedProject._id || selectedProject.id, {
        reportId: activeReport.id,
        measurements: mJson,
        notes,
        reportFileUrl: reportUrl || 'https://docs.google.com/document/mock-report',
      });

      setNotes('');
      setMeasurements('');
      setReportUrl('');
      await handleSelectProject(selectedProject);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Inspection report saved successfully. Ready for Design uploads.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleUploadDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const dLink = designUrl || 'https://docs.google.com/presentation/mock-design-layout';

      await projectApi.uploadDesign(selectedProject._id || selectedProject.id, dLink);

      setDesignUrl('');
      await handleSelectProject(selectedProject);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Design uploaded. Project moved to client review status.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleVerifyBid = async (quoteId: string) => {
    if (!selectedProject) return;
    try {
      await projectApi.verifyQuotation(
  selectedProject._id || selectedProject.id,
  quoteId,
  {}
);
      await handleSelectProject(selectedProject);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Quotation verified. Bidding details opened for homeowner comparison.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const photos = visitPhoto ? [visitPhoto] : [];
      await projectApi.submitSiteVisit(selectedProject._id || selectedProject.id, {
        reportType: visitType,
        notes: visitNotes,
        photos,
      });

      setVisitNotes('');
      setVisitPhoto('');
      await handleSelectProject(selectedProject);
      setNotification({
        type: 'success',
        message: 'Quality audit site report logged successfully.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleApproveHandover = async () => {
    if (!selectedProject) return;
    if (!confirm('Confirm completion handover? Verification audits must be completed.')) return;
    try {
      await projectApi.approveHandover(selectedProject._id || selectedProject.id);
      await handleSelectProject(selectedProject);
      await fetchData();
      setNotification({
        type: 'success',
        message: 'Project handover approved successfully.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleResolveDispute = async (
  disputeId: string,
  status: 'RESOLVED' | 'ESCALATED'
) => {
  try {
    await apiRequest(
      `/inspection/disputes/${disputeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          resolutionNotes: resolution,
          newStatus: status
        })
      }
    );

    setResolution('');
    await handleSelectProject(selectedProject);
    await fetchData();

    setNotification({
      type: 'success',
      message: `Dispute marked as ${status.toLowerCase()}`
    });
  } catch (err: any) {
    setNotification({
      type: 'error',
      message: err.message
    });
  }
};

  const stats = {
    pendingVerify: contractors.filter(c => c.status === 'PENDING_VERIFICATION').length,
    pendingInspections: projects.filter(p => p.status === 'PENDING_INSPECTION' || p.status === 'INSPECTION_SCHEDULED').length,
    pendingDesigns: projects.filter(p => p.status === 'INSPECTION_COMPLETED' || p.status === 'DESIGN_CREATION').length,
    activeWorks: projects.filter(p => ['WORK_STARTED', 'IN_PROGRESS'].includes(p.status)).length,
    disputes: revenueStats?.openDisputesCount || 0,
    completions: projects.filter(p => p.status === 'COMPLETION_VERIFICATION').length,
  };

  // Statuses where the ball is in the inspector's court, and what they need
  // to do about it. Everything else (waiting on the client or contractor)
  // is deliberately left out of this queue.
  const INSPECTOR_ACTION_BY_STATUS: Record<string, { label: string; hrefBase: 'project' | 'bids' }> = {
    PENDING_INSPECTION: { label: 'Schedule the site visit', hrefBase: 'project' },
    INSPECTION_SCHEDULED: { label: 'Submit the inspection report', hrefBase: 'project' },
    INSPECTION_COMPLETED: { label: 'Upload the design package', hrefBase: 'project' },
    DESIGN_CREATION: { label: 'Finish the design package', hrefBase: 'project' },
    DESIGN_APPROVED: { label: 'Publish the project to bidding', hrefBase: 'project' },
    QUOTATION_SUBMITTED: { label: 'Verify contractor quotations', hrefBase: 'bids' },
    COMPLETION_VERIFICATION: { label: 'Verify completion & issue handover', hrefBase: 'project' },
  };

  const actionQueue = projects
    .map((p: any) => {
      const action = INSPECTOR_ACTION_BY_STATUS[p.status];
      if (!action) return null;
      const id = p._id || p.id;
      return {
        id,
        title: p.title || 'Untitled Project',
        clientName: p.clientName || p.client?.name || p.clientId?.name || 'Unknown Client',
        status: p.status,
        label: action.label,
        href: action.hrefBase === 'bids' ? `/inspection/bids/${id}` : `/inspection/project/${id}`,
      };
    })
    .filter((item): item is { id: string; title: string; clientName: string; status: string; label: string; href: string } => item !== null);

  // Projects that stalled with zero usable bids after the deadline passed —
  // these need an inspector to pick a fresh bidding deadline, not a status
  // navigation link like the rest of the Action Required queue.
  const reopenBiddingQueue = projects
    .filter((p: any) => p.needsBiddingReopen)
    .map((p: any) => ({
      id: p._id || p.id,
      title: p.title || 'Untitled Project',
      clientName: p.clientName || p.client?.name || p.clientId?.name || 'Unknown Client',
      status: p.status,
    }));

  // Approved / Assigned projects for quick access
  const approvedProjects = projects.filter((p: any) => {
    const approvedStatuses = [
  'PROJECT_PUBLISHED',
  'BIDDING_OPEN',
  'CONTRACTOR_SELECTED',
  'CONTRACTOR_CONFIRMED',
  'WORK_STARTED',
  'IN_PROGRESS',
  'COMPLETION_VERIFICATION'
];
    return approvedStatuses.includes(p.status) || p.assignedInspectorId;
  });

  // Project list filters for Inspector Dashboard
  type FilterKey =
  | 'new'
  | 'all'
  | 'scheduled'
  | 'completed'
  | 'design-confirmed'
  | 'ongoing'
  | 'approved'
  | 'cancelled';

  const [projectFilter, setProjectFilter] = useState<FilterKey>('ongoing');
  const [search, setSearch] = useState('');

  const filterButtons: { key: FilterKey; label: string }[] = [
  { key: 'new', label: 'New Projects' },
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Inspection Scheduled' },
  { key: 'completed', label: 'Inspection Completed' },
  { key: 'design-confirmed',label: 'Design Confirmed'},
  { key: 'ongoing', label: 'Ongoing Projects' },
  { key: 'approved', label: 'Approved Projects' },
  { key: 'cancelled', label: 'Cancelled Projects' },
];

console.log(
  "CLIENT_COMPARISON PROJECTS:",
  projects.filter(
    p => p.status === "CLIENT_COMPARISON"
  )
);

  const filteredProjects = projects.filter((project) => {
  const keyword = search.trim().toLowerCase();

const matchesSearch =
  keyword === '' ||
  project.title?.toLowerCase().includes(keyword) ||
  project.city?.toLowerCase().includes(keyword) ||
  project.category?.toLowerCase().includes(keyword);

  if (!matchesSearch) return false;

  switch (projectFilter) {
    case 'new':
      return project.status === 'PENDING_INSPECTION';

    case 'scheduled':
      return project.status === 'INSPECTION_SCHEDULED';

    case 'completed':
  return (
    project.status === "INSPECTION_COMPLETED" &&
    !project.clientApproved
  );

    case 'design-confirmed':
  return (
    project.clientApproved === true &&
    project.inspectorApproved === false
  );

  case 'ongoing':
  return [
    'CONTRACTOR_CONFIRMED',
    'WORK_STARTED',
    'IN_PROGRESS',
    'COMPLETION_VERIFICATION',
  ].includes(project.status);

case 'approved':
  return (
    project.inspectorApproved === true ||
    project.status === "CLIENT_COMPARISON"
  );
    case 'cancelled':
      return project.status === 'CANCELLED';

    default:
      return true;
  }
});

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      <Sidebar />

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-dark text-gray-400 border-t border-gray-800 flex justify-around py-3.5 z-50 shadow-2xl">
        {[
          { id: 'overview', label: 'Overview', icon: Layout },
          { id: 'verifications', label: 'Verify', icon: User },
          { id: 'inspections', label: 'Inspect', icon: ClipboardList },
          { id: 'designs', label: 'Designs', icon: FileSpreadsheet },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              activeTab === btn.id ? 'text-secondary' : 'text-gray-500'
            }`}
          >
            <btn.icon size={18} />
            {btn.label}
          </button>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500"
        >
          <X size={18} />
          Logout
        </button>
      </nav>

      {/* DASHBOARD BODY */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 text-brand-dark">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">Inspector Workspace</h1>
            <p className="text-xs text-gray-500 mt-1">Review builder applications, measure properties, upload technical layouts, check pricing, and audit handovers.</p>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Action Required queue: only projects where it's the inspector's turn to act */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Action Required
                </h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">
                  {actionQueue.length + reopenBiddingQueue.length} pending
                </span>
              </div>

              {actionQueue.length === 0 && reopenBiddingQueue.length === 0 ? (
                <p className="rounded-xl bg-white p-4 text-sm text-slate-600">
                  You&apos;re all caught up — nothing needs your attention right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Stalled bidding — highest urgency, needs an inline reopen action rather than just a link */}
                  {reopenBiddingQueue.map((item) => (
                    <div
                      key={`reopen-${item.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.clientName} &middot; {item.status.replaceAll('_', ' ')}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          Bidding deadline passed with no usable bids — reopen bidding
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Default to today at 6:00 PM so the picker never opens
                          // on a blank/undefined date or time — inspector can
                          // still pick any other date/time before confirming.
                          const defaultDeadline = new Date();
                          setReopenProjectId(item.id);
                          setReopenDate(defaultDeadline.toISOString().slice(0, 10));
                          setReopenTime('18:00');
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                      >
                        Reopen Bidding <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}

                  {actionQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.clientName} &middot; {item.status.replaceAll('_', ' ')}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-primary">{item.label}</p>
                      </div>
                      <Link
                        href={item.href}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition-colors"
                      >
                        Open <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DateTimePickerModal
              open={!!reopenProjectId}
              onClose={() => setReopenProjectId(null)}
              date={reopenDate}
              time={reopenTime}
              onDateChange={setReopenDate}
              onTimeChange={setReopenTime}
              onSubmit={submitReopenBidding}
              dateLabel="Select New Deadline Date"
              timeLabel="Set New Deadline Time"
              submitLabel="Reopen Bidding"
              warningNote="Contractors will be notified and can submit new quotations until this deadline."
              disablePast
            />

            {/* Requested compact stats (Contractors, Active Projects, Pending Bids, Site Visits, Design Reviews, Disputes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-5 h-36 rounded-2xl border bg-red-50 text-red-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">
    
    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-red-700">
        Contractors
      </div>

      <div className="text-4xl font-extrabold leading-none text-red-700 mt-2">
        {contractors.length}
      </div>

      <div className="text-[13px] font-semibold text-gray-600 mt-3">
        Total Registered
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
      <User size={24} className="text-red-700" />
    </div>

  </div>
</div>

             
  <div className="p-5 h-36 rounded-2xl border bg-blue-50 text-blue-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">

    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-blue-700">
        Active Projects
      </div>

      <div className="text-4xl font-extrabold leading-none text-blue-700 mt-2">
        {projects.filter(
          p =>
            ![
              "PROJECT_COMPLETED",
              "REVIEW_SUBMITTED",
              "CANCELLED",
            ].includes(p.status)
        ).length}
      </div>

      <div className="text-[13px] font-semibold text-gray-600 mt-3">
        In Progress
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
      <Activity size={24} className="text-blue-700" />
    </div>

  </div>
</div>


            <div className="p-5 h-36 rounded-2xl border bg-amber-50 text-amber-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">

    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-amber-700">
        Pending Bids
      </div>

      <div className="text-4xl font-extrabold leading-none text-amber-700 mt-2">
        {projects.reduce(
          (acc, p) =>
            acc +
            ((p.quotations || []).filter((q: any) => !q.isVerified).length || 0),
          0
        )}
      </div>

      <div className="text-[13px] font-semibold text-gray-600 mt-3">
        Awaiting Verification
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
      <FileSpreadsheet size={24} className="text-amber-700" />
    </div>

  </div>
</div>

              <div className="p-5 h-36 rounded-2xl border bg-green-50 text-green-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">

    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-green-700">
        Site Visits
      </div>

      <div className="text-4xl font-extrabold leading-none text-green-700 mt-2">
        {projects.filter(
          p =>
            p.status === "PENDING_INSPECTION" ||
            p.status === "INSPECTION_SCHEDULED"
        ).length}
      </div>

      <div className="text-[13px] font-semibold text-gray-600">
        Upcoming Visits
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
      <MapPin size={24} className="text-green-700" />
    </div>

  </div>
</div>

              <div className="p-5 h-36 rounded-2xl border bg-purple-50 text-purple-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">

    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-purple-700">
        Design Reviews
      </div>

      <div className="text-4xl font-extrabold leading-none text-purple-700 mt-2">
        {projects.filter(
          p =>
            p.status === "INSPECTION_COMPLETED" ||
            p.status === "DESIGN_CREATION"
        ).length}
      </div>

      <div className="text-[13px] font-semibold text-gray-600 mt-3">
        Under Review
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
      <ClipboardList size={24} className="text-purple-700" />
    </div>

  </div>
</div>

              <div className="p-5 h-36 rounded-2xl border bg-pink-50 text-pink-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  <div className="flex justify-between items-start h-full">

    {/* Left Content */}
    <div className="flex flex-col h-full justify-between">
      <div className="text-[13px] font-bold text-pink-700">
        Disputes
      </div>

      <div className="text-4xl font-extrabold leading-none text-pink-700 mt-2">
        {revenueStats?.openDisputesCount || 0}
      </div>

      <div className="text-[13px] font-semibold text-gray-600 mt-3">
        Open Cases
      </div>
    </div>

    {/* Right Icon */}
    <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
      <AlertTriangle size={24} className="text-pink-700" />
    </div>

  </div>
</div>
            </div>

            {/* Quick assigned projects directory */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              {/* Filters (moved above Scheduled Projects) */}
              {/* Search + Filters */}
<div className="space-y-5 mb-6">

  {/* Search */}
  <div className="flex justify-between items-center flex-wrap gap-4">

    <div className="relative w-full md:w-80">

  <Search
    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400"
    size={18}
  />

  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search project..."
    className="
      w-full
      h-12
      rounded-xl
      border
      border-gray-200
      bg-white
      pl-12
      pr-4
      text-sm
      placeholder:text-gray-400
      focus:outline-none
      focus:ring-2
      focus:ring-[#70153A]
    "
  />

</div>

  </div>

  {/* Filter Buttons */}
  <div className="flex flex-wrap gap-3">

    {filterButtons.map((b) => (

      <motion.button
        key={b.key}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setProjectFilter(b.key)}
        className={`
          h-11
          px-5
          rounded-xl
          flex items-center gap-2
          text-sm font-medium
          transition-all
          duration-300
          whitespace-nowrap

          ${
            projectFilter === b.key
              ? "bg-[#70153A] text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }
        `}
      >

        {b.key === "all" && <Filter size={16} />}
        {b.key === "new" && <PlusCircle size={16} />}
        {b.key === "scheduled" && <Clock3 size={16} />}
        {b.key === "completed" && <CheckCircle size={16} />}
        {b.key === "ongoing" && <Activity size={16} />}
        {b.key === "approved" && <FolderCheck size={16} />}
        {b.key === "cancelled" && <Ban size={16} />}

        {b.label}

      </motion.button>

    ))}

  </div>

</div>

              {/* Scheduled and Approved sections removed per request */}

              <h3 className="text-lg font-bold text-primary font-serif">Projects</h3>
              <div>
                <AnimatePresence mode="wait">
                  <motion.div key={projectFilter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    {filteredProjects.length === 0 ? (
                      <div className="text-xs text-gray-400 py-6">No projects for the selected filter.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProjects.map((p) => {
                          console.log("CARD PROJECT:", p);
                          // Determine badge label and color
                          const statusMap: Record<string, { label: string; color: string }> = {
                            
                            PENDING_INSPECTION: { label: 'Created', color: 'bg-blue-100 text-blue-700' },
                            CLIENT_COMPARISON: {
  label: "Approved",
  color: "bg-purple-100 text-purple-700",
},
                            INSPECTION_SCHEDULED: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
                            INSPECTION_COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
                            DESIGN_CREATION: { label: 'Completed', color: 'bg-green-100 text-green-700' },
                            CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
                            BIDDING_OPEN: {label: 'Approved',color: 'bg-purple-100 text-purple-700'},
                            CONTRACTOR_SELECTED: {
  label: 'Builder Selected',
  color: 'bg-blue-100 text-blue-700'
},

CONTRACTOR_CONFIRMED: {
  label: 'Contractor Accepted',
  color: 'bg-green-100 text-green-700'
},

WORK_STARTED: {
  label: 'Work Started',
  color: 'bg-amber-100 text-amber-700'
},

IN_PROGRESS: {
  label: 'In Progress',
  color: 'bg-orange-100 text-orange-700'
},

COMPLETION_VERIFICATION: {
  label: 'Completion Verification',
  color: 'bg-emerald-100 text-emerald-700'
},
                          };

                          
                          let badge = statusMap[p.status] || {
  label: p.status?.replace(/_/g, " ") || "Unknown",
  color: "bg-gray-100 text-gray-700",
};

if (p.status === "PROJECT_PUBLISHED") {
  if (p.inspectorApproved) {
    badge = {
      label: "Approved",
      color: "bg-purple-100 text-purple-700",
    };
  } else if (p.clientApproved) {
    badge = {
      label: "Confirmed",
      color: "bg-blue-100 text-blue-700",
    };
  } else {
    badge = {
      label: "Published",
      color: "bg-orange-100 text-orange-700",
    };
  }
}

                          const imageUrl = p.coverImage || (p.images && p.images.length ? p.images[0] : '') || p.imageUrl || '';

                          return (
                            <Link
  href={`/inspection/project/${p._id || p.id}`}
  key={p._id || p.id}
  className="block group"
>
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6">

    {/* Header */}

    <div className="flex items-start justify-between">

      <div>

        <h2 className="text-3xl font-bold text-primary">
          {p.title}
        </h2>

        <p className="text-gray-500 mt-2">
          {p.category}
        </p>

      </div>

      <span
        className={`px-4 py-2 rounded-full text-xs font-bold ${badge.color}`}
      >
        {badge.label}
      </span>

    </div>

    {/* Information */}

    <div className="grid grid-cols-3 gap-6 mt-8">

      <div>

        <p className="text-xs text-gray-400 uppercase">
          Budget
        </p>

        <p className="text-l font-bold text-green-600 mt-1">
          ₹{p.budget?.toLocaleString()}
        </p>

      </div>

      <div>

        <p className="text-xs text-gray-400 uppercase">
          Area
        </p>

        <p className="text-l font-bold text-gray-800 mt-1">
  {p.squareFeet?.toLocaleString() || "-"} sq.ft
</p>

      </div>

      <div>

        <p className="text-xs text-gray-400 uppercase">
          City
        </p>

        <p className="text-l font-bold text-gray-800 mt-1">
          {p.city || "-"}
        </p>

      </div>

    </div>

    {/* Client */}

    <div className="mt-8">

      <p className="text-xs text-gray-400 uppercase">
        Client
      </p>

      <p className="font-semibold text-gray-800 mt-1">
        {p.clientName ||
          p.client?.name ||
          p.clientId?.name ||
          "-"}
      </p>

    </div>

    {/* Button */}

    <button
      className="mt-8 w-full h-12 rounded-2xl bg-primary text-white font-semibold hover:bg-[#5d1230] transition"
    >
      View Details
    </button>

  </div>
</Link>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTOR VERIFICATION QUEUE */}
        {activeTab === 'verifications' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-primary font-serif">Pending Contractor Registrations</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Aadhaar</th>
                    <th className="py-3 px-4">PAN</th>
                    <th className="py-3 px-4">Cities</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {contractors.filter((c: any) => c.status === 'PENDING_VERIFICATION').map((c: any) => (
                    <tr key={c._id || c.id}>
                      <td className="py-4 px-4 font-bold text-primary">{c.companyName}</td>

                      <td className="py-4 px-4 text-gray-600">{c.experience} Years</td>

                      <td className="py-4 px-4 text-gray-600">{c.userId?.email || '-'}</td>

                      <td className="py-4 px-4 text-gray-600">{c.phone || '-'}</td>

                      <td className="py-4 px-4 text-gray-600">{c.aadhaar || '-'}</td>

                      <td className="py-4 px-4 text-gray-600">{c.pan || '-'}</td>

                      <td className="py-4 px-4 text-gray-600">{c.serviceCities?.join(', ') || '-'}</td>

                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerifyContractor(c._id, 'VERIFIED')}
                            className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-700"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => handleVerifyContractor(c._id, 'REJECTED')}
                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {contractors.filter((c: any) => c.status === 'PENDING_VERIFICATION').length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">No pending contractor applications in verification queue.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INSPECTION MANAGEMENT TAB */}
        {activeTab === 'inspections' && (
          <div className="space-y-6">
            {selectedProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Scheduling and report upload forms */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Scheduling Section */}
                  {selectedProject.status === 'PENDING_INSPECTION' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                      <h3 className="text-base font-bold text-primary font-serif">Schedule Structural Site Visit</h3>
                      <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label htmlFor="inspection-visit-date" className="text-[10px] font-bold text-gray-500">Pick Inspection Visit Date</label>
                          <input title="Pick inspection visit date"
                            id="inspection-visit-date"
                            type="datetime-local"
                            required
                            aria-label="Pick inspection visit date"
                            placeholder="Pick inspection visit date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-brand-dark focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary-hover shadow"
                        >
                          Lock Inspection Date
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Complete Report upload Form */}
                  {selectedProject.status === 'INSPECTION_SCHEDULED' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                      <h3 className="text-base font-bold text-[#70153a] font-serif">Upload Site Inspection Report</h3>
                      <form onSubmit={handleCompleteReport} className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label htmlFor="inspection-measurements" className="text-[10px] font-bold text-gray-500">Measurements (e.g. Length, width, load-bearing assessment)</label>
                          <input
                            id="inspection-measurements"
                            type="text"
                            required
                            title="Measurements"
                            placeholder="e.g. Living room: 14x16 ft, Master bedroom: 12x12 ft"
                            value={measurements}
                            onChange={(e) => setMeasurements(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none text-brand-dark text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="inspection-notes" className="text-[10px] font-bold text-gray-500">Inspection Summary Notes</label>
                          <textarea
                            id="inspection-notes"
                            required
                            rows={3}
                            title="Inspection summary notes"
                            placeholder="Describe structural condition, masonry leveling status, paint wall dampness, layout notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none text-brand-dark text-sm resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="inspection-report-url" className="text-[10px] font-bold text-gray-500">Detailed Report PDF Link</label>
                          <input
                            id="inspection-report-url"
                            type="url"
                            title="Detailed report PDF link"
                            placeholder="Paste spreadsheet/document PDF folder link"
                            value={reportUrl}
                            onChange={(e) => setReportUrl(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none text-brand-dark text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded hover:bg-primary-hover shadow"
                        >
                          Save Report & Move to Designs
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Active Site visit logger (Work started phase) */}
                  {['WORK_STARTED', 'IN_PROGRESS'].includes(selectedProject.status) && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                      <h3 className="text-base font-bold text-[#70153a] font-serif">Audit Site Visit & QA Report</h3>
                      <form onSubmit={handleSiteVisit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="site-visit-type" className="text-[10px] font-bold text-gray-500">Report Category</label>
                            <select title="Report category"
                              id="site-visit-type"
                              aria-label="Report category"
                              value={visitType}
                              onChange={(e) => setVisitType(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm text-brand-dark focus:outline-none"
                            >
                              <option value="VISIT">Standard Progress Visit</option>
                              <option value="QUALITY">Quality Compliance stamp</option>
                              <option value="ISSUE">Structural/Timeline Issue alert</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="site-visit-photo" className="text-[10px] font-bold text-gray-500">Proof photo URL</label>
                            <input
                              id="site-visit-photo"
                              type="url"
                              title="Proof photo URL"
                              placeholder="Photo link"
                              value={visitPhoto}
                              onChange={(e) => setVisitPhoto(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="site-visit-notes" className="text-[10px] font-bold text-gray-500">Notes (deviation analysis)</label>
                          <textarea
                            id="site-visit-notes"
                            required
                            rows={3}
                            title="Notes deviation analysis"
                            placeholder="Detail quality status..."
                            value={visitNotes}
                            onChange={(e) => setVisitNotes(e.target.value)}
                            className="w-full p-2.5 bg-white border border-gray-200 rounded text-sm focus:outline-none resize-none"
                          />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-primary text-white text-xs font-bold rounded">
                          Save Audit Visit Log
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Completion Approval */}
                  {selectedProject.status === 'COMPLETION_VERIFICATION' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
                      <h3 className="text-base font-bold text-[#70153a] font-serif">Approve Project Completion</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Verify that all carpentry, civil layouts, painting texture, electrical grids, and design compliance checks are met. Release handover clearance.
                      </p>
                      <button
                        onClick={handleApproveHandover}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow"
                      >
                        Approve Handover Compliance
                      </button>
                    </div>
                  )}
                </div>

                {/* Right detailed specifications block */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 h-fit text-xs">
                  <h3 className="text-sm font-bold text-[#70153a] font-serif">Project Specs Overview</h3>
                  <ul className="space-y-2 text-gray-500">
                    <li><strong>Title:</strong> {selectedProject.title}</li>
                    <li><strong>Client:</strong> {selectedProject.client?.name}</li>
                    <li><strong>Category:</strong> {selectedProject.category}</li>
                    <li><strong>Budget:</strong> ₹{selectedProject.budget.toLocaleString()}</li>
                    <li><strong>Address:</strong> {selectedProject.address}</li>
                  </ul>
                  <div className="pt-4">
                    <Link href={`/messages/${selectedProject._id || selectedProject.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#6B0F2D] text-white text-xs font-bold rounded hover:opacity-95">
                      <MessageSquare size={16} /> Open Conversation
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Please select a project from the hub overview tab first.</p>
            )}
          </div>
        )}

        {/* UPLOAD DESIGN TAB */}
        {activeTab === 'designs' && (
          <div className="space-y-6">
            {selectedProject ? (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary font-serif">Upload Designs</h3>
                  <p className="text-xs text-gray-550 mt-1">Upload layouts. Client receives notification for approval.</p>
                </div>

                <form onSubmit={handleUploadDesign} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="layout-design-url" className="text-[10px] font-bold text-gray-500">Layout Design PDF Link</label>
                      <input
                        id="layout-design-url"
                        type="url"
                        required
                        title="Layout design PDF link"
                        placeholder="https://docs.google.com/presentation/your-layout"
                        value={designUrl}
                        onChange={(e) => setDesignUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none text-brand-dark text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow"
                  >
                    Submit Layout to Client
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-xs text-gray-405">Please select a project to proceed.</p>
            )}
          </div>
        )}

        {/* VERIFY BID QUOTATIONS TAB */}
        {activeTab === 'bids' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-primary font-serif">Verify Contractor Quotation Sheets</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-fixed border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 text-[10px] uppercase font-bold">
                    <th className="py-3 px-4">Contractor</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Timeline</th>
                    <th className="py-3 px-4">Bid Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {selectedProject?.quotations?.map((q: any) => (
                    <tr key={q.id}>
                      <td className="py-3.5 px-4 font-bold text-primary">{q.contractor.companyName}</td>
                      <td className="py-3.5 px-4 text-gray-650 font-semibold">{selectedProject.title}</td>
                      <td className="py-3.5 px-4 text-gray-500">{q.timeline}</td>
                      <td className="py-3.5 px-4 text-green-600 font-bold">₹{q.cost.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          q.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {q.isVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!q.isVerified && (
                          <button
                            onClick={() => handleVerifyBid(q.id)}
                            className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary-hover transition-colors"
                          >
                            Verify Bid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!selectedProject?.quotations || selectedProject?.quotations?.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">No quotation bids submitted yet for selected project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DISPUTES RESOLUTION CONTROL TAB */}
        {activeTab === 'disputes' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-primary font-serif">Disputes Investigation & Resolution panel</h3>
            
            <div className="space-y-4">
              {selectedProject?.disputes?.map((d: any) => (
                <div key={d.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-600 font-serif">Raised by {d.raisedBy}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      d.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-650 font-medium"><strong>Reason:</strong> {d.reason}</p>
                  
                  {d.status === 'OPEN' && (
                    <div className="pt-2 space-y-2 text-xs">
                      <div className="space-y-1">
                        <label htmlFor={`resolution-notes-${d.id}`} className="text-[10px] font-bold text-gray-600">Resolution Notes</label>
                        <textarea
                          id={`resolution-notes-${d.id}`}
                          rows={2}
                          title="Resolution notes"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Describe inspection finding and resolution contract amendment..."
                          className="w-full p-2 bg-white border border-gray-200 rounded text-brand-dark focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveDispute(d.id, 'RESOLVED')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded"
                        >
                          Resolve Dispute
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, 'ESCALATED')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
                        >
                          Escalate to Admin
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!selectedProject?.disputes || selectedProject?.disputes?.length === 0) && (
                <p className="text-xs text-gray-400 py-6">No disputes raised for selected project.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
