'use client';

import React, { Suspense, useState, useEffect } from 'react';
import BiddingCountdown from "@/components/common/BiddingCountdown";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building,
  FileSpreadsheet,
  XCircle,
  MapPin, 
  FolderOpen,
  Activity, 
  Clock, 
  Layout, 
  ChevronDown,
  CheckCircle2,
  Eye, 
  X, 
  FileText, 
  Search, 
  Plus, 
  AlertTriangle,
  Upload,
  User,
  ArrowRight,
  Briefcase,
  Wallet,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { projectApi, commonApi } from '@/lib/api';
import { useLightbox } from '@/context/LightboxContext';
import { isImageUrl } from '@/lib/files';
import logoPng from '../../../../assets/Logo-B&W.png';
import FilterSelect from '@/components/common/FilterSelect';
import { useRealtimeRefresh } from '@/components/RealtimeSyncProvider';

function ContractorDashboardContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { openFile } = useLightbox();
const searchParams = useSearchParams();

  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // CHANGE: keep the raw API projects in state so the filtering flow is traceable.
  
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [submittedProjects, setSubmittedProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  // ACCEPTANCE WORKFLOW: track the card currently accepting and show dashboard toast feedback.
  const [acceptingProjectId, setAcceptingProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [constructionWorksView, setConstructionWorksView] = useState<"active" | "declined">("active");
  const [projectView, setProjectView] =
useState<
    "OPEN" |
    "QUOTATIONS" |
    "REQUOTE" |
    "REJECTED" |
    "DECLINED" |
    "COMPLETED"
>("OPEN");
  
  const [loading, setLoading] = useState(true);
  const initialTab =
    (searchParams.get("tab") as "overview" | "browse" | "active") ||
    "overview";

const [activeTab, setActiveTab] = useState<
    "overview" | "browse" | "active"
>(initialTab);

useEffect(() => {
  const tab =
    (searchParams.get("tab") as
      | "overview"
      | "browse"
      | "active") ||
    "overview";

  setActiveTab(tab);
}, [searchParams]);
  
  // Bidding form states
  const [cost, setCost] = useState('');
  const [timeline, setTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('Premium materials (Teak wood, 1st class brick, Asian paints)');
  const [paymentTerms, setPaymentTerms] = useState('30-40-30 milestone structure');
  const [notes, setNotes] = useState('');
  const [quotationFileUrl, setQuotationFileUrl] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);

  // Daily log updates state
  const [dailyLog, setDailyLog] = useState('');
  const [dailyPhoto, setDailyPhoto] = useState('');

  // Filters for browse
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'CONTRACTOR')) {
      router.push('/auth/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading]);

  useRealtimeRefresh(() => fetchData());

  // ACCEPTANCE WORKFLOW: normalize contractor ids so selected projects appear in My Construction Works.
  const getContractorProfileId = () => {
  console.log("========== CURRENT USER ==========");
  console.log(user);

  const contractorId =
    user?.profile?.profile?._id || // Contractor document _id
    user?.profile?._id ||          // Fallback
    user?.profile?.profile?.id ||  // Fallback
    user?.profile?.id ||           // User id (last fallback)
    "";

  console.log("Resolved Contractor ID:", contractorId);

  return contractorId;
};

  const isAssignedToCurrentContractor = (project: any) => {

    const assignedContractorId =
        project.contractorId?._id ||
        project.contractorId ||
        "";

    const currentContractorId =
        getContractorProfileId();

    console.log("========== CONTRACTOR MATCH ==========");
    console.log("Project:", project.title);
    console.log("Project Contractor:", assignedContractorId);
    console.log("Current Contractor:", currentContractorId);
    console.log(
        "MATCH =",
        String(assignedContractorId) ===
        String(currentContractorId)
    );

    return (
        String(assignedContractorId) ===
        String(currentContractorId)
    );
};

  const applyProjectLists = (allProjects: any[]) => {
      console.log("API Projects", allProjects); // CHANGE: temporary log to trace the raw API response before any frontend filters run.
      setProjects(allProjects); // CHANGE: store the raw API response before deriving filtered buckets.
      console.log("Projects State Input", allProjects); // CHANGE: temporary log for the projects state input.

      // Available until the client selects a contractor.
      const openProjects = allProjects.filter(
    (p: any) =>
        ["PROJECT_PUBLISHED", "BIDDING_OPEN", "CLIENT_COMPARISON"].includes(p.status) &&
        !p.hasSubmittedQuotation &&
        !["CONTRACTOR_SELECTED", "CONTRACTOR_CONFIRMED", "WORK_STARTED", "IN_PROGRESS", "COMPLETION_VERIFICATION", "READY_FOR_HANDOVER", "PROJECT_COMPLETED"].includes(p.status)
);

const submittedProjects = allProjects.filter(
    (p: any) =>
        // CHANGE: Submitted Quotations must be driven by the contractor's quotation,
        // not by the project status. CLIENT_COMPARISON, CONTRACTOR_SELECTED,
        // and completed projects remain visible unless the quotation was rejected.
        (p.hasSubmittedQuotation === true || p.myQuotation != null) &&
        !p.quotationRejected &&
        p.myQuotation?.status !== "REJECTED"
);

console.log(
  "Open Projects",
  openProjects.map((p: any) => ({
    title: p.title,
    status: p.status,
    hasSubmittedQuotation: p.hasSubmittedQuotation,
    quotationVerified: p.quotationVerified,
    selected: p.myQuotation?.selected,
  }))
); // CHANGE: temporary log after the open-project filter.

console.log(
  "Submitted Projects",
  submittedProjects.map((p: any) => ({
    title: p.title,
    status: p.status,
    hasSubmittedQuotation: p.hasSubmittedQuotation,
    quotationVerified: p.quotationVerified,
    selected: p.myQuotation?.selected,
    quotationRejected: p.quotationRejected,
  }))
); // CHANGE: temporary log after the submitted-quotation filter.

setAvailableProjects(openProjects);

setSubmittedProjects(submittedProjects);



      // Active are where contractorId is assigned.
      const activeFilteredProjects = allProjects.filter(isAssignedToCurrentContractor);

      console.log(
        "Active Projects",
        activeFilteredProjects.map((p: any) => ({
          title: p.title,
          status: p.status,
          hasSubmittedQuotation: p.hasSubmittedQuotation,
          quotationVerified: p.quotationVerified,
          selected: p.myQuotation?.selected,
        }))
      ); // CHANGE: temporary log after the active-project filter.

      setActiveProjects(activeFilteredProjects);

      // fetch approved/assigned projects for this contractor
const approved = allProjects.filter(
       (p: any) =>
         p.status === 'PROJECT_PUBLISHED' ||
         p.status === 'BIDDING_OPEN' ||
         p.status === 'CONTRACTOR_ASSIGNED'
);

console.log(
  "Approved Projects",
  approved.map((p: any) => ({
    title: p.title,
    status: p.status,
    hasSubmittedQuotation: p.hasSubmittedQuotation,
    quotationVerified: p.quotationVerified,
    selected: p.myQuotation?.selected,
  }))
); // CHANGE: temporary log after the approved-project filter.

setApprovedProjects(approved); 
  };

  // ACCEPTANCE WORKFLOW: refresh only the project list after accepting, not the whole page.
  const refreshProjectLists = async () => {
    const allProjects = await projectApi.list();
    applyProjectLists(allProjects);
    return allProjects;
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {

    setLoading(true);
    let allProjects: any[] = [];


    try {
      console.log("FETCH DATA STARTED");

      try {
    allProjects = await projectApi.list();
    
    console.log("========== ALL PROJECTS ==========");

allProjects.forEach((p: any) => {
  console.log({
    title: p.title,
    status: p.status,
    hasSubmittedQuotation: p.hasSubmittedQuotation,
    quotationRejected: p.quotationRejected,
    myQuotation: p.myQuotation,
  });
});

    console.log("ALL PROJECTS:");
    console.log(allProjects);
    console.log("TYPE:", typeof allProjects);
    console.log("IS ARRAY:", Array.isArray(allProjects));
    console.log("COUNT:", allProjects?.length);

} catch (err) {
    console.error("PROJECT API ERROR");
    console.error(err);
}
      applyProjectLists(allProjects);

      const citiesData = await commonApi.getCities();
      const catsData = await commonApi.getCategories();
      setCities(citiesData);
      setCategories(catsData);

      if (allProjects.length > 0) {
        const firstActive = allProjects.find(isAssignedToCurrentContractor);
        if (firstActive) {
          const detailed = await projectApi.getById(
            firstActive._id || firstActive.id
);
          setSelectedProject(detailed);
        }
      }
    } catch (err) {
      console.error('Error fetching contractor records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActiveProject = async (proj: any) => {
    try {
      const detailed = await projectApi.getById(
      proj._id || proj.id
);
      setSelectedProject(detailed);
      setActiveTab('active');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBid = (proj: any) => {
    setSelectedProject(proj);
    setShowBidModal(true);
  };

  const handleOpenDesign = async (proj: any) => {
    // A tab is opened up front so the popup blocker sees it as part of the
    // click. Images no longer need it — they render in the lightbox — so the
    // placeholder is closed once we know what kind of file this is.
    const blank = window.open('', '_blank');
    try {
      const detailed = await projectApi.getById(proj._id || proj.id);
      const fileUrl = detailed.designFiles?.[0]?.fileUrl;
      if (fileUrl) {
        if (isImageUrl(fileUrl)) {
          if (blank) blank.close();
          openFile(fileUrl);
        } else if (blank) {
          blank.location.href = fileUrl;
        } else {
          window.open(fileUrl, '_blank');
        }
        return;
      }
    } catch (err) {
      console.error('Failed to load design for project', err);
    }
    if (blank) {
      blank.close();
    }
    router.push("/contractor/dashboard?tab=browse")
  };

  // ACCEPTANCE WORKFLOW: call the existing PUT /projects/:id/accept-project endpoint.
  const handleAcceptProject = async (proj: any) => {
    const projectId = proj._id || proj.id;
    if (!projectId) return;

    try {
      setAcceptingProjectId(String(projectId));
      await projectApi.acceptProject(projectId);

      const refreshedProjects = await refreshProjectLists();
      const refreshedProject = refreshedProjects.find((p: any) => String(p._id || p.id) === String(projectId));

      if (selectedProject && String(selectedProject._id || selectedProject.id) === String(projectId)) {
        setSelectedProject({
          ...selectedProject,
          ...(refreshedProject || {}),
          status: 'CONTRACTOR_CONFIRMED',
          contractorAccepted: true,
          contractorAcceptedAt: refreshedProject?.contractorAcceptedAt || new Date().toISOString(),
        });
      }

      showToast('success', 'Project accepted successfully.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Unable to accept project.');
    } finally {
      setAcceptingProjectId(null);
    }
  };

  // DECLINE WORKFLOW: contractor was selected but can't take the job —
  // reopens the project so the client can pick a different verified bid.
  const handleDeclineProject = async (proj: any) => {
    const projectId = proj._id || proj.id;
    if (!projectId) return;

    const reason = window.prompt(
      'Why are you declining this project? This will be shared with the client.'
    );
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      showToast('error', 'Please provide a reason before declining.');
      return;
    }

    if (!window.confirm('Decline this project? The client will be able to select a different contractor.')) {
      return;
    }

    try {
      setAcceptingProjectId(String(projectId));
      await projectApi.declineProject(projectId, reason.trim());
      await refreshProjectLists();
      showToast('success', 'Project declined. The client has been notified.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Unable to decline project.');
    } finally {
      setAcceptingProjectId(null);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const quotationUrl = quotationFileUrl || 'https://docs.google.com/spreadsheets/mock-quotation';
      await projectApi.submitQuotation(selectedProject.id, {
        cost,
        timeline,
        description,
        materialsIncluded: materials,
        paymentTerms,
        notes,
        quotationFileUrl: quotationUrl,
      });
      setShowBidModal(false);
      // Reset form
      setCost('');
      setTimeline('');
      setDescription('');
      setNotes('');
      setQuotationFileUrl('');

      await fetchData();
      alert('Quotation submitted successfully. Awaiting inspector verification.');
    } catch (err: any) {
      alert(err.message || 'Error submitting quotation');
    }
  };

  const handleDailyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const photos = dailyPhoto ? [dailyPhoto] : [];
      await projectApi.submitDailyUpdate(selectedProject.id, {
        notes: dailyLog,
        photos,
      });
      setDailyLog('');
      setDailyPhoto('');
      await handleSelectActiveProject(selectedProject);
      alert('Daily update report saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Error saving update');
    }
  };

  const handleRequestCompletion = async () => {
    if (!selectedProject) return;
    try {
      await projectApi.requestCompletion(selectedProject.id);
      await handleSelectActiveProject(selectedProject);
      alert('Handover verification requested. The inspection team has been notified.');
    } catch (err: any) {
      alert(err.message || 'Error requesting completion audit');
    }
  };
  console.log('Current User Full:', JSON.stringify(user, null, 2));
  console.log('User Object:', user);
  console.log('Profile:', user?.profile);
  console.log('Status:', user?.profile?.profile?.status);
  console.log("USER =", user);
  console.log("PROFILE =", user?.profile);
  console.log("PROFILE PROFILE =", user?.profile?.profile);
  console.log("COMPANY =", user?.profile?.companyName);
  console.log("COMPANY2 =", user?.profile?.profile?.companyName);
  const isVerified =
    user?.profile?.profile?.status === 'VERIFIED';
  const companyName =
    user?.profile?.profile?.companyName || 'Partner';

  const stats = {
    available: availableProjects.length,
    active: activeProjects.filter(p => !['PROJECT_COMPLETED', 'REVIEW_SUBMITTED', 'CANCELLED'].includes(p.status)).length,
    completed: activeProjects.filter(p => ['PROJECT_COMPLETED', 'REVIEW_SUBMITTED'].includes(p.status)).length,
  };

  const isOpenForNewQuotation = (project: any) =>
    ["PROJECT_PUBLISHED", "BIDDING_OPEN", "CLIENT_COMPARISON"].includes(project.status) &&
    !project.hasSubmittedQuotation;

  const isRequoteRequested = (project: any) =>
    project.requoteRequested === true || project.myQuotation?.requoteRequested === true;

  const hasPendingSubmittedQuotation = (project: any) => (
    // CHANGE: Keep this helper aligned with the Submitted Quotations tab rule.
    // The quotation itself decides visibility; later project statuses do not hide it.
    (project.hasSubmittedQuotation === true || project.myQuotation != null) &&
    !project.quotationRejected &&
    project.myQuotation?.status !== "REJECTED" &&
    // Sent back for a re quote — it belongs in the Re Quote tab, not here.
    !isRequoteRequested(project)
  );

  const getQuotationStageLabel = (project: any) => {
    if (isRequoteRequested(project)) {
      return "Re Quote Requested";
    }

    if (project.status === "CLIENT_COMPARISON") {
      return "Client Comparing";
    }

    if (project.quotationVerified) {
      return "Verified";
    }

    return "Awaiting Verification";
  };

  // ACCEPTANCE WORKFLOW: status labels and badge colors for assigned construction cards.
  const getConstructionStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      CONTRACTOR_SELECTED: {
        label: 'Awaiting Acceptance',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
      },
      CONTRACTOR_CONFIRMED: {
        label: 'Project Accepted',
        className: 'bg-green-50 text-green-700 border-green-200',
      },
      WORK_STARTED: {
        label: 'Work Started',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      IN_PROGRESS: {
        label: 'In Progress',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      READY_FOR_HANDOVER: {
        label: 'Ready For Handover',
        className: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      PROJECT_COMPLETED: {
        label: 'Completed',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      },
    };

    return badges[status] || {
      label: status?.replace(/_/g, ' ') || 'Assigned',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    };
  };

  const isSelectedContractor = (project: any) => {
    if (!project) return false;
    return String(project.contractorId?._id || project.contractorId || '') === String(user?.profile?.id || user?.profile?._id || '');
  };

  const summarizeProjectsForDebug = (projects: any[]) =>
    projects.map((p: any) => ({
      title: p.title,
      status: p.status,
      hasSubmittedQuotation: p.hasSubmittedQuotation,
      quotationVerified: p.quotationVerified,
      selected: p.myQuotation?.selected,
      quotationRejected: p.quotationRejected,
    }));

  const sourceProjects =
    projectView === "QUOTATIONS"
      ? submittedProjects // CHANGE: Submitted Quotations must render from submittedProjects, not availableProjects.
    : projectView === "COMPLETED"
        ? projects
        : projectView === "REJECTED"
          ? projects
          : projectView === "DECLINED"
            ? projects
            : projectView === "REQUOTE"
              ? projects
              : availableProjects;

  console.log(
    "Display Source Projects",
    projectView,
    summarizeProjectsForDebug(sourceProjects)
  ); // CHANGE: temporary log before the tab-specific display filter.

  const displayedByProjectView = sourceProjects.filter((p: any) => {
    // Open Projects
    if (projectView === "OPEN") {
      return isOpenForNewQuotation(p);
    }

    // Completed Projects
    if (projectView === "COMPLETED") {
      return [
        "PROJECT_COMPLETED",
        "REVIEW_SUBMITTED",
      ].includes(p.status);
    }

    // Submitted Quotations
    if (projectView === "QUOTATIONS") {
      // CHANGE: Show every non-rejected submitted quotation regardless of project status.
      return hasPendingSubmittedQuotation(p);
    }

    // Re Quote — inspector sent the quotation back for revised figures.
    if (projectView === "REQUOTE") {
      return isRequoteRequested(p);
    }

    // Rejected Quotations
    if (projectView === "REJECTED") {
      return p.quotationRejected;
    }

    // Declined — you were selected but declined before confirming.
    if (projectView === "DECLINED") {
      return p.contractorDeclinedProject;
    }

    return true;
  });

  console.log(
    "Displayed Projects After Tab Filter",
    projectView,
    summarizeProjectsForDebug(displayedByProjectView)
  ); // CHANGE: temporary log after the tab-specific display filter.

  const displayedProjects = displayedByProjectView.filter((p: any) => {
    const matchSearch =
      !searchTerm ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCity =
      !cityFilter || p.city === cityFilter;

    const matchCategory =
      !categoryFilter || p.category === categoryFilter;

    const matchBudget =
      !budgetFilter || p.budget <= Number(budgetFilter);

    return (
      matchSearch &&
      matchCity &&
      matchCategory &&
      matchBudget
    );
  });

  console.log(
    "Displayed Projects After Search/City/Category/Budget Filters",
    {
      projectView,
      searchTerm,
      cityFilter,
      categoryFilter,
      budgetFilter,
      projects: summarizeProjectsForDebug(displayedProjects),
    }
  ); // CHANGE: temporary log after preserving the existing user filters.

  console.log(
    "Project Cards",
    summarizeProjectsForDebug(displayedProjects)
  ); // CHANGE: temporary log for the exact project cards passed into JSX rendering.

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      
      {/* DESKTOP DARK SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0">
        <div className="space-y-8">
          <Link href="/" className="block">
            <img
              src={logoPng.src}
              alt="ConstroBID"
              className="mx-auto w-[210px] max-w-full object-contain"
            />
          </Link>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Layout },
              { id: 'browse', label: 'Browse Open Projects', icon: Search },
              { id: 'active', label: 'My Construction Works', icon: Building },
              { id: 'finance', label: 'Project Finance', icon: Wallet },
            ].map((btn) => (
              <button
                key={btn.id}
                disabled={!isVerified && btn.id !== 'overview'}
                onClick={() => {
  // Project Finance is its own screen, not a tab on this page.
  if (btn.id === 'finance') {
    router.push('/contractor/finance');
    return;
  }

  setActiveTab(btn.id as any);

  router.push(
    `/contractor/dashboard?tab=${btn.id}`
  );
}}
    className={`relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 disabled:opacity-40 ${
  activeTab === btn.id
    ? "bg-[#8E3A5A] text-white shadow-xl before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full before:bg-[#F4C542]"
    : "text-gray-300 hover:bg-white/10 hover:text-white"
}`}
              >
                <btn.icon size={16} />
                {btn.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-secondary border border-primary">
              <Briefcase size={16} />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold block truncate">
  {user?.profile?.profile?.companyName || 'Contractor'}
</span>
              <span className="text-[10px] text-gray-400 block truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2.5 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout Account
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary text-white border-t border-white flex justify-around py-3.5 z-50 shadow-2xl">
        {[
          { id: 'overview', label: 'Overview', icon: Layout },
          { id: 'browse', label: 'Browse', icon: Search },
          { id: 'active', label: 'Active', icon: Building },
          { id: 'finance', label: 'Finance', icon: Wallet },
        ].map((btn) => (
          <button
            key={btn.id}
            disabled={!isVerified && btn.id !== 'overview'}
            onClick={() => {
  if (btn.id === 'finance') {
    router.push('/contractor/finance');
    return;
  }

  setActiveTab(btn.id as any);

  router.push(
    `/contractor/dashboard?tab=${btn.id}`
  );
}}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold disabled:opacity-30 ${
              activeTab === btn.id ? 'text-secondary' : 'text-white'
            }`}
          >
            <btn.icon size={18} />
            {btn.label}
          </button>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      {/* DASHBOARD BODY */}
      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 text-brand-dark">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">
  Welcome back, {user?.profile?.profile?.companyName || 'Partner'}
</h1>
            <p className="text-xs text-gray-500 mt-1">Submit quotations, manage site construction stages, and upload daily progress logs.</p>
          </div>
          <div className="flex items-center gap-2">
  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
    Verification Status:
  </span>

  <span
    className={`px-3 py-1 rounded-full text-xs font-bold ${
      user?.profile?.profile?.status === 'VERIFIED'
        ? 'bg-green-100 text-green-700'
        : user?.profile?.profile?.status === 'REJECTED'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700 animate-pulse'
    }`}
  >
    {user?.profile?.profile?.status?.replace(/_/g, ' ') ||
      'PENDING VERIFICATION'}
  </span>
</div>
        </div>

        {/* NON-VERIFIED UNLOCK NOTIFICATION */}
        {!isVerified && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-3 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-base font-bold text-amber-800 font-serif">Account Verification Pending</h3>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                Your PAN, Aadhaar, and GST details are currently being reviewed by our audit inspection team. 
                Once approved, your profile will be published in the public directory and you will unlock project bidding access.
              </p>
            </div>
          </div>
        )}

        {isVerified && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

{/* Available */}
<div className="group h-36 rounded-2xl border bg-pink-50 border-pink-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <div className="flex justify-between items-start h-full">

    <div className="flex flex-col justify-between h-full">
      <h3 className="text-[13px] font-bold text-primary">
        Available Projects
      </h3>

      <div className="text-4xl font-extrabold text-primary">
        {stats.available}
      </div>

      <p className="text-[13px] font-semibold text-gray-600">
        New Opportunities
      </p>
    </div>

    <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
      <Search className="text-primary" size={24} />
    </div>

  </div>
</div>

{/* Active */}

<div className="group h-36 rounded-2xl border bg-green-50 border-green-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <div className="flex justify-between items-start h-full">

    <div className="flex flex-col justify-between h-full">
      <h3 className="text-[13px] font-bold text-green-700">
        Active Projects
      </h3>

      <div className="text-4xl font-extrabold text-green-700">
        {stats.active}
      </div>

      <p className="text-[13px] font-semibold text-gray-600">
        Ongoing Work
      </p>
    </div>

    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
      <Activity className="text-green-700" size={24} />
    </div>

  </div>
</div>

{/* Pending */}

<div className="group h-36 rounded-2xl border bg-yellow-50 border-yellow-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <div className="flex justify-between items-start h-full">

    <div className="flex flex-col justify-between h-full">
      <h3 className="text-[13px] font-bold text-yellow-700">
        Pending Review
      </h3>

      <div className="text-4xl font-extrabold text-yellow-700">
        0
      </div>

      <p className="text-[13px] font-semibold text-gray-600">
        Awaiting Review
      </p>
    </div>

    <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
      <Clock className="text-yellow-700" size={24} />
    </div>

  </div>
</div>


{/* Completed */}

<div className="group h-36 rounded-2xl border bg-purple-50 border-purple-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
  <div className="flex justify-between items-start h-full">

    <div className="flex flex-col justify-between h-full">
      <h3 className="text-[13px] font-bold text-purple-700">
        Completed Projects
      </h3>

      <div className="text-4xl font-extrabold text-purple-700">
        {stats.completed}
      </div>

      <p className="text-[13px] font-semibold text-gray-600">
        Successfully Delivered
      </p>
    </div>

    <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
      <CheckCircle2 className="text-purple-700" size={24} />
    </div>

  </div>
</div>

</div>

                {/* Active Works lists */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-primary font-serif">My Active Construction Projects</h3>
                  {activeProjects.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6">You have no active projects. Browse open requirements to submit bids.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProjects.map((p) => {

  console.log("PROJECT DATA:", p);

  return (
                        <div key={p._id || p.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                          <div className="flex items-start justify-between">

  <div>

    <h3 className="text-2xl font-bold text-[#70153A]">
      {p.title}
    </h3>

    <p className="mt-1 text-gray-500">
      {p.category} • {p.city}
    </p>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">

  <div>
    <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
      Budget
    </p>

    <p className="mt-2 text-lg font-bold text-green-600">
      ₹{p.budget?.toLocaleString()}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
      Square Feet
    </p>

    <p className="mt-2 text-lg font-bold text-gray-800 whitespace-nowrap">
      {p.squareFeet} Sq.Ft
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
      Project Created Date
    </p>

    <p className="mt-2 text-lg font-bold text-gray-800 whitespace-nowrap">
      {p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-IN")
        : "--"}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
      Inspection Approved Date
    </p>

    <p className="mt-2 text-lg font-bold text-gray-800 whitespace-nowrap">
      {p.inspectorApprovedAt
        ? new Date(p.inspectorApprovedAt).toLocaleDateString("en-IN")
        : "--"}
    </p>
  </div>

</div>

  </div>

  <span className="px-4 py-2 rounded-full text-xs font-semibold bg-green-100 text-green-700">
    Active
  </span>

</div>
                          <div className="flex justify-center mt-1">

  <button
  onClick={() =>
    router.push(`/contractor/project/${p._id || p.id}?from=works`)
  }
  className="w-52 h-11 rounded-xl bg-[#70153A] text-white text-sm font-semibold hover:bg-[#5C1030] hover:shadow-lg transition-all duration-200"
>
  Manage Site
</button>

</div>
                        </div>
                      );

})}
                    </div>
                  )}
                </div>

              </div>
            )}
            {/* BROWSE ACTIVE PROJECTS TAB */}
            {activeTab === 'browse' && (
              <div className="space-y-6">
                {/* Search & Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">

  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

    {/* Search */}

    <div className="relative md:col-span-2">

      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="text"
        placeholder="Search projects..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
      />

    </div>

    {/* Budget */}

    <FilterSelect
      label="Filter by Budget"
      value={budgetFilter}
      onChange={setBudgetFilter}
      options={[
        { value: "", label: "All Budgets" },
        { value: "50000", label: "Below ₹50,000" },
        { value: "100000", label: "Below ₹1 Lakh" },
        { value: "500000", label: "₹1L - ₹5L" },
        { value: "1000000", label: "₹5L - ₹10L" },
        { value: "999999999", label: "Above ₹10L" },
      ]}
    />

  </div>


</div>

<div className="flex flex-wrap gap-3 mb-6">

  {/* Open Projects */}

  <button
    onClick={() => setProjectView("OPEN")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "OPEN"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <FolderOpen size={18} />
    Open Projects
  </button>

  {/* Submitted Quotations */}

  <button
    onClick={() => setProjectView("QUOTATIONS")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "QUOTATIONS"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <FileSpreadsheet size={18} />
    Submitted Quotations
  </button>

  {/* Re Quote */}

  <button
    onClick={() => setProjectView("REQUOTE")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "REQUOTE"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <FileSpreadsheet size={18} />
    Re Quote
  </button>

  {/* Completed */}

  <button
    onClick={() => setProjectView("COMPLETED")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "COMPLETED"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <CheckCircle2 size={18} />
    Completed Projects
  </button>

    {/* Rejected Quotations */}

  <button
  onClick={() => setProjectView("REJECTED")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "REJECTED"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <FileSpreadsheet size={18} />
    Rejected Quotations
  </button>

    {/* Declined by me */}

  <button
  onClick={() => setProjectView("DECLINED")}
    className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 ${
      projectView === "DECLINED"
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <XCircle size={18} />
    Declined Projects
  </button>

</div>


                {/* Project items directory */}
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* CHANGE: Render the already-traced displayedProjects array so the
                      Submitted Quotations tab uses submittedProjects as its source,
                      while search, city, category, and budget filters still apply. */}
                  {displayedProjects.map((p: any) => {
  return (
                      <div key={p._id || p.id} className="bg-white border border-gray-150 p-6 rounded-xl shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded bg-primary/5 uppercase">{p.category}</span>
                            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                              <MapPin size={12} /> {p.city}
                            </span>
                          </div>
                          
                          <h4 className="text-base font-bold text-[#70153a] font-serif">{p.title}</h4>
                          {p.hasSubmittedQuotation && (
                            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                              {getQuotationStageLabel(p)}
                            </span>
                          )}

                          {/* Makes clear this card only shows up here because you declined it —
                              the bidding-closed banner below is a separate, unrelated fact. */}
                          {p.contractorDeclinedProject && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                You Declined This Project
                              </p>
                              {p.myQuotation?.contractorDeclineReason && (
                                <p className="mt-1 text-xs text-red-600">
                                  <span className="font-semibold">Your reason: </span>
                                  {p.myQuotation.contractorDeclineReason}
                                </p>
                              )}
                            </div>
                          )}

  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

    <div>
      <p className="text-xs font-bold ">Client</p>
      <p className="mt-1">
        {p.clientName || "Loading..."}
      </p>
    </div>

    <div>
      <p className="text-xs font-bold ">Area</p>
      <p className="mt-1 ">  
        {p.squareFeet} sq.ft
      </p>
    </div>

    <div>
  <p className="text-xs font-bold text-blue-600">
    Project Budget
  </p>
  <p className="mt-1 font-semibold">
    ₹{p.budget?.toLocaleString()}
  </p>
</div>

<div>
  <p className="text-xs font-bold text-green-600">
    My Quotation
  </p>

  <p className="mt-1 font-bold text-green-700">
    ₹{(
      p.myQuotation?.grandTotal ??
      p.myQuotation?.cost ??
      0
    ).toLocaleString()}
  </p>
</div>

{p.hasSubmittedQuotation && (
<div>
  <p className="text-xs font-bold text-gray-600">
    Submitted On
  </p>

  <p className="mt-1">
    {p.myQuotation?.createdAt
      ? new Date(
          p.myQuotation.createdAt
        ).toLocaleDateString("en-IN")
      : "--"}
  </p>
</div>
)}

    <div>
      <p className="text-xs font-bold ">Inspection</p>
      <p className="mt-1 font-bold text-green-600">
        {p.inspectionNotes ? "✅ Completed" : "⏳ Pending"}
      </p>
    </div>
    <div>
      <p className="text-xs font-bold">Design</p>

<p
  className={`mt-1 font-bold ${
    p.approvedDesign ||
    p.approvedDesignId ||
    (p.designFiles && p.designFiles.length > 0)
      ? "text-green-600"
      : "text-yellow-600"
  }`}
>
  {p.approvedDesign ||
  p.approvedDesignId ||
  (p.designFiles && p.designFiles.length > 0)
    ? "✅ Available"
    : "⏳ Pending"}
</p>
    </div>

                          </div>
                        </div>

                        {p.quotationDeadline && !p.contractorDeclinedProject && (
  <BiddingCountdown
    deadline={p.quotationDeadline}
  />
)}

                        <div className="flex gap-2">
                        
                          <button
                            type="button"
                            onClick={() => handleOpenDesign(p)}
                            className="flex-1 rounded-lg border border-[#E8C6CF] bg-white py-2.5 text-center text-xs font-semibold text-[#6B0F2D] shadow-sm hover:border-[#6B0F2D] hover:bg-[#6B0F2D] hover:text-white transition-all duration-200"
                          >
                            View Design
                          </button>

                          <Link
                            href={`/contractor/project/${p._id || p.id}?from=browse`}
                            className="flex-1 rounded-lg border border-[#E8C6CF] bg-white py-2.5 text-center text-xs font-semibold text-[#6B0F2D] shadow-sm hover:border-[#6B0F2D] hover:bg-[#6B0F2D] hover:text-white transition-all duration-200"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    );

})}

                  {displayedProjects.length === 0 && ( // CHANGE: empty state must reflect the active tab plus search/city/category/budget filters.
                    <div className="col-span-2 py-16 text-center bg-white rounded-xl border border-gray-150 p-6 space-y-3">
                      <Building size={48} className="text-gray-300 mx-auto" />
                      <h4 className="text-base font-bold text-gray-500">No open project bidding found</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">All published projects have either been assigned or are currently undergoing inspection stages.</p>
                    </div>
                  )}
                </div>
              </div>
              
            )}

            {/* ACTIVE PROJECT SITE MANAGEMENT TAB */}
            {activeTab === 'active' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-2xl font-bold text-primary font-serif">My Construction Works</h3>
                      <p className="text-xs text-gray-500 mt-1">Assigned projects selected by clients for your team.</p>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">
                      {activeProjects.length} Assigned
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setConstructionWorksView("active")}
                      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        constructionWorksView === "active"
                          ? "bg-primary text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Active Projects
                    </button>
                    <button
                      type="button"
                      onClick={() => setConstructionWorksView("declined")}
                      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        constructionWorksView === "declined"
                          ? "bg-primary text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Declined Projects
                    </button>
                  </div>

                  {/* ACCEPTANCE WORKFLOW: assigned projects render as cards with View Details and conditional Accept Project. */}
                  {constructionWorksView === "active" && (activeProjects.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6">You have no assigned construction works yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeProjects.map((p: any) => {
                        const projectId = p._id || p.id;
                        const statusBadge = getConstructionStatusBadge(p.status);
                        const awaitingAcceptance = p.status === 'CONTRACTOR_SELECTED';

                        return (
                          <div
                            key={projectId}
                            className="rounded-2xl border border-[#E7D8DE] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h2 className="text-2xl font-extrabold leading-tight text-[#70153A]">
                                  {p.title}
                                </h2>

                                <p className="mt-2 text-base text-gray-500">
                                  {p.category}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusBadge.className}`}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Information */}
                            <div className="mt-5 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-[10px] uppercase text-gray-400">
                                  Budget
                                </p>

                                <p className="mt-1 text-xl font-bold text-green-600">
                                  ₹{p.budget?.toLocaleString()}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] uppercase text-gray-400">
                                  Area
                                </p>

                                <p className="mt-1 text-xl font-bold text-gray-800">
                                  {p.squareFeet} sq.ft
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] uppercase text-gray-400">
                                  City
                                </p>

                                <p className="mt-1 text-xl font-bold text-gray-800">
                                  {p.city}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5">
                              <p className="text-[10px] uppercase text-gray-400">
                                Client
                              </p>

                              <p className="mt-1 text-xl font-bold text-gray-800">
                                {p.clientName || p.clientId?.name}
                              </p>
                            </div>

                            <div className="mt-5">
                              <Link
                                href={`/contractor/project/${projectId}?from=works`}
                                className="flex h-11 items-center justify-center rounded-xl bg-[#70153A] text-lg font-bold text-white transition hover:bg-[#5B1230]"
                              >
                                View Details
                              </Link>
                            </div>

                            {awaitingAcceptance && (
                              <>
                                <button
                                  onClick={() => handleAcceptProject(p)}
                                  className="mt-3 h-11 w-full rounded-xl border border-[#70153A] font-bold text-[#70153A] transition hover:bg-[#70153A] hover:text-white"
                                >
                                  Accept Project
                                </button>
                                <button
                                  onClick={() => handleDeclineProject(p)}
                                  className="mt-2 h-11 w-full rounded-xl border border-red-400 font-bold text-red-600 transition hover:bg-red-500 hover:text-white"
                                >
                                  Reject Project
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Projects this contractor was selected for but declined before confirming. */}
                {constructionWorksView === "declined" && (
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold text-primary font-serif">Declined Projects</h3>
                      <p className="text-xs text-gray-500 mt-1">Projects you were selected for but chose not to take on.</p>
                    </div>

                    {projects.filter((p: any) => p.contractorDeclinedProject).length === 0 ? (
                      <p className="text-xs text-gray-400 py-6">You haven&apos;t declined any projects.</p>
                    ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {projects
                        .filter((p: any) => p.contractorDeclinedProject)
                        .map((p: any) => {
                          const projectId = p._id || p.id;
                          return (
                            <div
                              key={projectId}
                              className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h2 className="text-xl font-bold text-gray-700">{p.title}</h2>
                                  <p className="mt-1 text-sm text-gray-500">{p.category}</p>
                                </div>
                                <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
                                  Declined
                                </span>
                              </div>

                              {p.myQuotation?.contractorDeclineReason && (
                                <p className="mt-3 text-xs text-gray-500">
                                  <span className="font-semibold text-gray-600">Your reason: </span>
                                  {p.myQuotation.contractorDeclineReason}
                                </p>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-[10px] uppercase text-gray-400">Budget</p>
                                  <p className="mt-1 font-bold text-gray-700">₹{p.budget?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-gray-400">City</p>
                                  <p className="mt-1 font-bold text-gray-700">{p.city}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed right-4 top-4 z-[60] rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BID PLACEMENT MODAL */}
      <AnimatePresence>
        {showBidModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-primary text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Place Quotation Bid</h3>
                  <p className="text-[11px] text-gray-200 mt-0.5">{selectedProject.title} (Budget: ₹{selectedProject.budget.toLocaleString()})</p>
                </div>
                <button
                  onClick={() => setShowBidModal(false)}
                  aria-label="Close bid modal"
                  title="Close"
                  className="text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitBid} className="p-6 overflow-y-auto space-y-4 text-xs">
                
                {/* View Technical Design */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <h4 className="font-bold text-[#70153a]">Inspection Files Provided:</h4>
                  <div className="flex flex-col gap-2">
                    {selectedProject.inspectionReports && selectedProject.inspectionReports[0] && (
                      <span className="text-[11px] text-gray-500"><strong>Notes:</strong> {selectedProject.inspectionReports[0].notes || 'None'}</span>
                    )}
                    <div className="flex gap-2 pt-1">
                      {selectedProject.designFiles && selectedProject.designFiles[0] && (
                        <a href={selectedProject.designFiles[0].fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">Download Layout PDF</a>
                      )}
                    </div>
                  </div>
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="bidCost" className="text-xs font-bold text-gray-600 block">Your Bid Amount (INR)</label>
                    <input
                      id="bidCost"
                      type="number"
                      required
                      placeholder="e.g. 1150000"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="bidTimeline" className="text-xs font-bold text-gray-600 block">Completion Timeline</label>
                    <input
                      id="bidTimeline"
                      type="text"
                      required
                      placeholder="e.g. 45 Days or 2 Months"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="bidMaterials" className="text-xs font-bold text-gray-600 block">Materials Standard Specifications</label>
                  <input
                    id="bidMaterials"
                    type="text"
                    required
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="bidPaymentTerms" className="text-xs font-bold text-gray-600 block">Payment Milestones terms</label>
                  <input
                    id="bidPaymentTerms"
                    type="text"
                    required
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="bidQuotationFile" className="text-xs font-bold text-gray-600 block">Upload Quotation XLSX/PDF Link</label>
                  <input
                    id="bidQuotationFile"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/yoursheet"
                    value={quotationFileUrl}
                    onChange={(e) => setQuotationFileUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="bidDescription" className="text-xs font-bold text-gray-600 block">Detailed Bid Description / Cover Note</label>
                  <textarea
                    id="bidDescription"
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail your quote. Mention carpenter allocations, finish level options..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-brand-dark text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all-300"
                >
                  Submit Competitive Bid
                </button>
              </form>
            </motion.div>
          </div>
        )}
            </AnimatePresence>
    </div>
  );
}

export default function ContractorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-sm text-gray-500">
            Loading dashboard...
          </div>
        </div>
      }
    >
      <ContractorDashboardContent />
    </Suspense>
  );
}
