'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, 
  Plus, 
  FileSpreadsheet, 
  MapPin, 
  Activity, 
  Clock, 
  Star, 
  ListFilter,
  CheckCircle2, 
  Eye, 
  X, 
  Calendar, 
  User, 
  Sparkles,
  Search,
  DollarSign,
  Briefcase,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { projectApi, commonApi } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';
import StatsCard from '../../../components/client/StatsCard';
import NotificationsPanel from '../../../components/client/NotificationsPanel';
import RecentQuotes from '../../../components/client/RecentQuotes';
import RecentPayments from '../../../components/client/RecentPayments';
import { useRealtimeRefresh } from '@/components/RealtimeSyncProvider';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const displayName = (() => {
    // /auth/profile returns { id, email, role, profile }; AuthContext stores
    // that whole object as user.profile, so the real Client record is one
    // level deeper — mirrors user?.profile?.profile?.companyName on the
    // contractor dashboard.
    const profile = (user as any)?.profile?.profile || (user as any)?.profile;
    if (!profile && !user) return 'Homeowner';
    if (profile?.name) return profile.name;
    if (profile?.firstName || profile?.lastName) return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    if ((user as any)?.name) return (user as any).name;
    if (user?.email) return user.email.split('@')[0];
    return 'Homeowner';
  })();

  const [projects, setProjects] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] =
useState<
  'overview' |
  'projects' |
  'quotations' |
  'bidding'
>('overview');

  // Form states for creating a project
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Interior Design');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [squareFeet, setSquareFeet] = useState('');
  const [budget, setBudget] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Action states
  const [designComment, setDesignComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const fetchNotifications = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const data = await res.json();

    setNotifications(data || []);
  } catch (err) {
    console.error("Notification error:", err);
  }
};

const fetchRecentQuotations = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/projects/client/quotations`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load quotations");
    }

    const data = await res.json();

    setRecentQuotations(data);
  } catch (err) {
    console.error("Recent Quotations Error:", err);
  }
};

  // Re-fetch whenever another user's action changes something relevant —
  // status updates, new quotations, design approvals — instead of only on
  // a manual page refresh.
  useRealtimeRefresh(() => {
    fetchData();
    fetchRecentQuotations();
  });

  useEffect(() => {
  if (!authLoading && (!user || user.role !== 'CLIENT')) {
    router.push('/auth/login');
  } else if (user) {
    fetchData();
    fetchNotifications();
    fetchRecentQuotations();   // <-- Add this line
  }
}, [user, authLoading]);

  const applyTab = (tab: string | null) => {
    setActiveTab(
      tab === "overview" || tab === "projects" || tab === "quotations" || tab === "bidding"
        ? tab
        : "overview"
    );
  };

  // useSearchParams() is reactive to URL query changes even when the pathname
  // stays /client/dashboard, so clicking a sidebar tab while already on this
  // page (not just navigating in from elsewhere) actually switches the view.
  useEffect(() => {
    applyTab(searchParams.get('tab'));
  }, [searchParams]);

  useEffect(() => {
    const handleSidebarTabChange = (event: Event) => {
      applyTab((event as CustomEvent<string>).detail);
    };

    window.addEventListener('client-sidebar-tab-change', handleSidebarTabChange);

    return () => {
      window.removeEventListener('client-sidebar-tab-change', handleSidebarTabChange);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await projectApi.list();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        // Fetch detailed version of first project
        const detailed = await projectApi.getById(data[0]._id);
        setSelectedProject(detailed);
      } else if (selectedProject) {
        const detailed = await projectApi.getById(selectedProject._id);
        setSelectedProject(detailed);
      }
    } catch (err) {
      console.error('Error fetching client projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (proj: any) => {
    try {
      const detailed = await projectApi.getById(proj._id);
      setSelectedProject(detailed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Basic client-side validation and type coercion
      if (!title.trim() || !description.trim() || !propertyType || !squareFeet || !budget || !address || !city) {
        alert('Please fill all required fields before submitting.');
        return;
      }
      if (!Array.isArray(photos) || photos.length === 0) {
        alert('Please upload at least one project photo before submitting.');
        return;
      }

      const sq = Number(String(squareFeet).replace(/,/g, ''));
      const bud = Number(String(budget).replace(/,/g, ''));

      if (!Number.isFinite(sq) || sq <= 0) {
        alert('Please enter a valid numeric value for Property Square Feet.');
        return;
      }
      if (!Number.isFinite(bud) || bud <= 0) {
        alert('Please enter a valid numeric value for Estimated Budget.');
        return;
      }

      await projectApi.create({
        title: title.trim(),
        category,
        description: description.trim(),
        propertyType,
        squareFeet: sq,
        budget: bud,
        address: address.trim(),
        city,
        photos,
        files: photos.map((u) => ({ fileUrl: u, fileType: 'IMAGE' })),
      });
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setSquareFeet('');
      setBudget('');
      setAddress('');
      setPhotos([]);
      
      await fetchData();
      alert('Project posted successfully. Ready for inspection scheduler.');
    } catch (err: any) {
      console.error('Create project failed', err);
      // Prefer server message if available
      alert(err?.message || 'Error creating project. Check server logs for details.');
    }
  };

  const handleReviewDesign = async (approve: boolean) => {
    if (!selectedProject) return;
    try {
      await projectApi.reviewDesign(selectedProject.id, approve, designComment);
      setDesignComment('');
      await fetchData();
      alert(approve ? 'Design Approved!' : 'Revision comments submitted.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectContractor = async (quoteId: string) => {
    if (!selectedProject) return;
    if (!confirm('Are you sure you want to select this contractor for your project?')) return;
    try {
      await projectApi.selectQuote(selectedProject._id, quoteId);
      await fetchData();
      alert('Contractor selected. Awaiting contract confirmation.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmContract = async () => {
    if (!selectedProject) return;
    try {
      await projectApi.confirmContractor(selectedProject.id);
      await fetchData();
      alert('Contract confirmed! Work has officially started.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelProject = async () => {
    if (!selectedProject) return;
    try {
      const response = await projectApi.cancel(selectedProject.id);
      await fetchData();
      alert(response.message || 'Cancellation processed');
    } catch (err: any) {
      alert(err.message || 'Unable to cancel project');
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await projectApi.raiseDispute(selectedProject.id, disputeReason);
      setShowDisputeModal(false);
      setDisputeReason('');
      await fetchData();
      alert('Dispute raised successfully. Our inspection team is investigating.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await projectApi.submitReview(selectedProject.id, { rating: reviewRating, comment: reviewComment });
      setReviewComment('');
      await fetchData();
      alert('Thank you for your review!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Status utility
  const getStatusBadge = (status: string) => {
    const successStates = ['DESIGN_APPROVED', 'PROJECT_PUBLISHED', 'CONTRACTOR_CONFIRMED', 'WORK_STARTED', 'IN_PROGRESS', 'PROJECT_COMPLETED', 'REVIEW_SUBMITTED'];
    const warningStates = ['PENDING_INSPECTION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'DESIGN_CREATION', 'DESIGN_SUBMITTED', 'CLIENT_REVIEW', 'QUOTATION_SUBMITTED', 'QUOTATION_VERIFIED', 'CLIENT_COMPARISON', 'CONTRACTOR_SELECTED', 'COMPLETION_VERIFICATION', 'READY_FOR_HANDOVER'];
    
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
    if (successStates.includes(status)) return 'bg-green-100 text-green-700';
    if (warningStates.includes(status)) return "bg-[#FFF7DA] text-[#D97706] border border-[#FDE68A]";
    return 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => !['PROJECT_COMPLETED', 'REVIEW_SUBMITTED', 'CANCELLED'].includes(p.status)).length,
    completed: projects.filter(p => ['PROJECT_COMPLETED', 'REVIEW_SUBMITTED'].includes(p.status)).length,
    pendingBids: selectedProject?.quotations?.filter((q: any) => !q.isVerified).length || 0,
  };
  const filteredProjects = projects.filter((project) => {

  const matchesSearch =
    project.title
      .toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "ALL"
      ? true
      : project.status === statusFilter;

  return matchesSearch && matchesStatus;

});

  // Derive right-column data from selectedProject safely
  const derivedNotifications = notifications.map((n: any) => ({
  title: n.title,
  message: n.message,
  time: new Date(n.createdAt).toLocaleString(),
}));

  const derivedQuotes = selectedProject?.quotations || [];

  const derivedPayments = (selectedProject?.payments || selectedProject?.invoices || []).map((p: any) => ({
    id: p.id || p._id || String(Math.random()).slice(2, 8),
    invoice: p.invoice || p.invoiceNo || p.number || `INV-${String(p.id || p._id || '').slice(-6)}`,
    project: selectedProject?.title || p.project || '',
    amount: p.amount || p.total || 0,
    date: p.date ? new Date(p.date).toLocaleDateString() : p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
  }));

  // Compute aggregated metrics used by the Stats cards
  const totalQuotesCount = recentQuotations.reduce(
  (total, project) => total + project.quotationCount,
  0
);

  const totalSpentValue = projects.reduce((acc, p: any) => {
    const payments = p.payments || p.invoices || [];
    const projectSum = (payments || []).reduce((s: number, pay: any) => s + (Number(pay.amount || pay.total || 0) || 0), 0);
    return acc + projectSum;
  }, 0) || (derivedPayments || []).reduce((s: number, pay: any) => s + (Number(pay.amount || 0) || 0), 0);

  const formatINR = (n: number) => {
    if (!n) return '₹0';
    // show in lakhs for large numbers (L)
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${Number(n).toLocaleString('en-IN')}`;
  };
  const showDashboardHeader = activeTab !== "bidding";

  return (
    <>
      {/* DASHBOARD BODY CONTAINER (Offset on Desktop by 64px/260px) */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 text-brand-dark">
        {/* Top Header bar */}
        {showDashboardHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">Welcome back, {displayName}</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Manage project workflow states, compare bids, approve designs and track inspection site reviews.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-fit px-5 py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-lg flex items-center gap-2 hover:-translate-y-0.5 transition-transform duration-200"
          >
            <Plus size={15} />
            Post New Requirement
          </button>
        </div>
        )}

        {/* LOADING STATE */}
        {loading && projects.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Synchronizing project records...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                  <StatsCard
label="Total Projects"
value={stats.total}
meta={`${stats.active} Active`}
icon={Building}
className="bg-[#FDF2F8] border-[#F3C2D6]"
iconBg="bg-[#F8D7E4]"
iconColor="text-[#70153a]"
/>
                  <StatsCard
label="Total Quotes"
value={totalQuotesCount}
meta="Received"
icon={FileSpreadsheet}
className="bg-[#EEF5FF] border-[#C8DEFF]"
iconBg="bg-[#DCEBFF]"
iconColor="text-[#2563EB]"
/>
                  <StatsCard
label="Pending Approvals"
value={stats.pendingBids}
meta="Requires your action"
icon={Clock}
className="bg-[#FFF9E8] border-[#FFE9A6]"
iconBg="bg-[#FFF0C4]"
iconColor="text-[#D97706]"
/>
                </div>
                <div className="bg-white rounded-2xl border px-6 py-5 space-y-4">

<div className="flex flex-wrap gap-4 items-center">

<input
type="text"
placeholder="Search Project..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border rounded-full px-5 h-11 w-72"
/>

<button
onClick={()=>setShowCreateModal(true)}
className="bg-primary text-white rounded-full px-8 h-11 font-semibold"
>
+ New Project
</button>

</div>

<div className="flex flex-wrap gap-3">

<button
onClick={()=>setStatusFilter("ALL")}
className={`px-6 py-3 rounded-full ${
statusFilter==="ALL"
?"bg-primary text-white"
:"bg-gray-100"
}`}
>
All ({projects.length})
</button>

<button
onClick={()=>setStatusFilter("PENDING_INSPECTION")}
className="
px-6
h-11
rounded-full
bg-gray-100
hover:bg-primary
hover:text-white
transition-all
duration-300
"
>
Pending Inspection
</button>

<button
onClick={()=>setStatusFilter("INSPECTION_SCHEDULED")}
className="
px-3
h-11
rounded-full
bg-gray-100
hover:bg-primary
hover:text-white
transition-all
duration-300
"
>
Inspection Scheduled
</button>

<button
onClick={()=>setStatusFilter("INSPECTION_COMPLETED")}
className="
px-6
h-11
rounded-full
bg-gray-100
hover:bg-primary
hover:text-white
transition-all
duration-300
"
>
Inspection Completed
</button>

<button
onClick={() => setStatusFilter("PROJECT_PUBLISHED")}
className="
px-6
h-11
rounded-full
bg-gray-100
hover:bg-primary
hover:text-white
transition-all
duration-300
"
>
Project Published
</button>
<button
onClick={()=>setStatusFilter("CANCELLED")}
className="
px-6
h-11
rounded-full
bg-gray-100
hover:bg-primary
hover:text-white
transition-all
duration-300
"
>
Cancelled
</button>

</div>

</div>

<div className="grid
grid-cols-1
md:grid-cols-2
xl:grid-cols-3
gap-6">

{filteredProjects.map(project=>(

<div
key={project._id}
className="
bg-white
rounded-2xl
border
p-5
shadow-sm
hover:shadow-lg
transition
h-[270px]
flex
flex-col
justify-between
"
>

<div className="flex justify-between">

<div>

<h2 className="text-2xl font-bold text-primary">
{project.title}
</h2>

<p className="text-gray-500">
{project.category}
</p>

</div>

<span
  className={`inline-flex items-center
  px-3
  h-8
  rounded-full
  text-[10px]
  font-semibold
  whitespace-nowrap
  ${getStatusBadge(project.status)}`}
>
  {project.status.replaceAll("_", " ")}
</span>

</div>

<div className="grid grid-cols-3 mt-6 text-center">

<div>

<p className="text-gray-400 text-xs">
Budget
</p>

<p className="font-bold text-green-600">

₹{project.budget.toLocaleString()}

</p>

</div>

<div>

<p className="text-gray-400 text-xs">
Square Feet
</p>

<p className="font-bold">

{project.squareFeet}

</p>

</div>

<div>

<p className="text-gray-400 text-xs">
City
</p>

<p className="font-bold">

{project.city}

</p>

</div>

</div>

<div className="grid grid-cols-2 gap-3">

<button
onClick={()=>{
router.push(`/client/my-projects/${project._id || project.id}`);
}}
className="bg-primary text-white rounded-lg px-5 py-2"
>

View Details

</button>

<button
onClick={()=>{
setActiveTab("bidding");
handleSelectProject(project);
}}
className="border rounded-lg px-5 py-2"
>

Compare Quotes

</button>

</div>

</div>

))}

</div>

</div>
)}
            {/* PROJECTS DIRECTORY LIST TAB */}
            {activeTab === 'projects' && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary font-serif">Project Portfolio History</h3>
                  <div className="flex items-center gap-2">
                    <ListFilter size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500 font-semibold">List View</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-8">

  <div className="relative">
    <Search
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
    />

    <input
      type="text"
      placeholder="Search Project..."
      className="pl-11 pr-4 py-3 w-72 border rounded-full focus:outline-none"
    />
  </div>

  <button
    className="w-100 bg-primary text-white px-7 py-3 rounded-full font-semibold flex items-center gap-2"
  >
    <Plus size={18} />
    New Project
  </button>

</div>

<div className="flex flex-wrap gap-4 mb-8">

<button className="px-6 py-3 rounded-full bg-primary text-white font-semibold">
All ({projects.length})
</button>

<button className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200">
Pending Inspection
</button>

<button className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200">
Inspection Scheduled
</button>

<button className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200">
Inspection Completed
</button>

<button className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200">
Approved
</button>

<button className="px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200">
Cancelled
</button>

</div>


                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-[10px] uppercase font-bold">
                        <th className="py-3 px-4">Project Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">City</th>
                        <th className="py-3 px-4">Budget</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {projects.map((p) => (
                        <tr key={p._id || p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-primary">{p.title}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-semibold">{p.category}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-semibold">{p.city}</td>
                          <td className="py-3.5 px-4 text-green-600 font-bold">₹{p.budget.toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(p.status)}`}>
                              {p.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                handleSelectProject(p);
                                setActiveTab('overview');
                              }}
                              className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded hover:bg-primary hover:text-white transition-colors"
                            >
                              Open Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QUOTATION COMPARISONS TAB */}
{activeTab === "bidding" && (
<div className="space-y-6">

<button
  type="button"
  onClick={() => {
    setActiveTab("overview");
    router.push("/client/dashboard");
  }}
  className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5"
>
  <ArrowLeft size={18} />
  Back to Dashboard
</button>

{selectedProject && (

<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

<div>

<p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
PROJECT
</p>

<h1 className="text-4xl font-bold text-primary mt-2">
{selectedProject.title}
</h1>

<div className="flex flex-wrap items-center gap-3 mt-4 text-gray-500 text-sm">

<span className="inline-flex items-center gap-1.5">
<Building size={14} />
{selectedProject.propertyType}
</span>

<span>•</span>

<span>
{selectedProject.category}
</span>

<span>•</span>

<span className="inline-flex items-center gap-1.5">
<MapPin size={14} />
{selectedProject.city}
</span>

</div>

</div>

<div className="flex flex-col items-end gap-3">

<span
className="
px-5
py-2
rounded-full
bg-amber-100
text-amber-700
font-semibold
"
>
{selectedProject.status.replaceAll("_"," ")}
</span>

<div className="text-right">

<p className="text-xs text-gray-400">
Verified Quotations
</p>

<p className="text-3xl font-bold text-primary">

{
selectedProject.quotations?.filter(
(q:any)=>q.isVerified
).length || 0
}

</p>

</div>

</div>

</div>

</div>

)}

<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

<h2 className="text-2xl font-bold text-primary font-serif">
Side-by-Side Quotation Comparison
</h2>

<p className="text-gray-500 mt-2">
Compare verified contractor bids. Analyze cost quotes,
completion timelines, payment milestones,
material specifications and contractor experience.
</p>

</div>

<div className="mt-6">
</div>

                {selectedProject && selectedProject.quotations ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedProject.quotations.filter((q: any) => q.isVerified).map((quote: any) => (
                      <div 
                        key={quote._id} 
                        className={`bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                          (quote.selected ?? quote.isSelected) ? 'border-green-500 shadow-green-50/50' : 'border-gray-150'
                        }`}
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-primary leading-none">{quote.contractorId?.companyName}</h4>
                            <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                              <Star size={13} className="fill-yellow-500" />
                              {quote.contractorId?.experience} Yrs Exp
                            </div>
                          </div>

                          {quote.contractorDeclined && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                This Contractor Declined Your Project
                              </p>
                              {quote.contractorDeclineReason && (
                                <p className="mt-1 text-xs text-red-600">
                                  <span className="font-semibold">Reason: </span>
                                  {quote.contractorDeclineReason}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Total Cost</span>
                              <span className="text-base font-extrabold text-green-600">₹{quote.cost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Timeline</span>
                              <span className="text-xs font-bold text-[#70153a]">{quote.validityDays} Days</span>
                            </div>
                          </div>

                          <div className="text-xs space-y-2 text-gray-600">
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase font-bold block">Materials Standard</span>
                              <span className="font-medium">{quote.materials?.length || 0} Materials</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase font-bold block">Payment Terms</span>
                              <span className="font-medium">₹{quote.grandTotal?.toLocaleString()}</span>
                            </div>
                            {quote.notes && (
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase font-bold block">Builder Notes</span>
                                <span className="font-medium italic">"{quote.inspectorRemarks}"</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center gap-3">

  <Link
    href={`/client/quotations/${selectedProject._id}/${quote._id}`}
    className="flex-1 py-2 bg-white border border-gray-200 text-center text-xs font-semibold rounded hover:border-primary transition-all text-primary"
  >
    View Details
  </Link>

  {/* The ConstroBID team quotation, not the contractor's own file. */}
  {quote.constrobidQuotation && (
    <a
      href={quote.constrobidQuotation}
      target="_blank"
      rel="noreferrer"
      className="flex-1 py-2 bg-white border border-gray-200 text-center text-xs font-semibold rounded hover:border-primary transition-all text-primary"
    >
      Download Quotation
    </a>
  )}

  {selectedProject.status === "CLIENT_COMPARISON" && (
    quote.contractorDeclined ? (
      <button
        type="button"
        disabled
        className="flex-1 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed text-center"
      >
        Declined
      </button>
    ) : (
      <button
        onClick={() => handleSelectContractor(quote._id)}
        className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded hover:bg-primary-hover transition-colors text-center"
      >
        Select Builder
      </button>
    )
  )}

</div>
                      </div>
                    ))}

                    {selectedProject.quotations.filter((q: any) => q.isVerified).length === 0 && (
                      <div className="col-span-3 py-16 text-center bg-white rounded-xl border border-gray-150 p-6 space-y-3">
                        <FileSpreadsheet size={48} className="text-gray-300 mx-auto" />
                        <h4 className="text-base font-bold text-gray-500">No verified bids submitted yet</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">Quotations must be reviewed and verified by the inspection team before they appear here.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Please select an active project to compare competitive contractor quotations.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE REQUIREMENT DIALOG MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-primary text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Post New Construction / Interior Need</h3>
                  <p className="text-[11px] text-gray-200 mt-0.5">Define your specifications. Certified structural inspection begins next.</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} aria-label="Close dialog" className="text-white/80 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateProject} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Project Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3BHK Modular Design & Installation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="category" className="text-xs font-bold text-gray-600 block">Service Category <span className="text-red-500">*</span></label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                      >
                      <option value="Interior Design">Interior Design</option>
                      <option value="Civil Construction">Civil Construction</option>
                      <option value="Renovation">Renovation</option>
                      <option value="Commercial Fitout">Commercial Fitout</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="propertyType" className="text-xs font-bold text-gray-600 block">Property Type <span className="text-red-500">*</span></label>
                    <select
                      id="propertyType"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Independent Villa">Independent Villa</option>
                      <option value="Commercial Shop">Commercial Shop</option>
                      <option value="Office Building">Office Building</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Property Square Feet <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1500"
                      value={squareFeet}
                      onChange={(e) => setSquareFeet(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Estimated Budget (INR) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1200000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="city" className="text-xs font-bold text-gray-600 block">Property City <span className="text-red-500">*</span></label>
                    <select
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Project Photos <span className="text-red-500">*</span></label>
                    <ImageUploader onUploadComplete={(items) => setPhotos(items.map((it) => it.url))} />
                    {photos.length === 0 && (
                      <p className="text-[11px] text-amber-600 font-semibold">Upload at least one site photo.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Site Full Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Enter locality details"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Detailed Requirements Description <span className="text-red-500">*</span></label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mention materials quality level, timeline expectations, modular layout needs, partition requirements..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all-300"
                >
                  Submit & Post Requirement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISPUTE REGISTRATION MODAL */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 border border-gray-150 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-primary flex items-center gap-1.5">
                  <AlertCircle className="text-red-500" size={18} />
                  Raise Dispute Claim
                </h3>
                <button onClick={() => setShowDisputeModal(false)} aria-label="Close dispute dialog" className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRaiseDispute} className="space-y-4 text-xs">
                <p className="text-gray-500">
                  Provide detailed facts regarding work deviations, budget escalations, delay of timeline, or materials layout mismatch. Our admin panel will review.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600 block">Dispute Details</label>
                  <textarea
                    required
                    rows={4}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Detail the issue..."
                    className="w-full p-2 bg-white border border-gray-200 rounded text-xs text-brand-dark focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
                >
                  Submit Dispute Claim
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
