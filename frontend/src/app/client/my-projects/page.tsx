'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Clock3,
  Hammer,
} from "lucide-react";
import { projectApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/components/RealtimeSyncProvider";
export default function MyProjectsPage() {
  const router = useRouter();

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;

    const fetchProjects = async () => {
  setLoading(true);

  try {
    const data = await projectApi.list();
    setProjects(data);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  } finally {
    setLoading(false);
  }
};

   useEffect(() => {
  fetchProjects();
}, []);

   useRealtimeRefresh(() => fetchProjects());

   useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter, sortBy]);

const getStatusBadge = (status: string) => {
    const successStates = ['DESIGN_APPROVED', 'PROJECT_PUBLISHED', 'CONTRACTOR_CONFIRMED', 'WORK_STARTED', 'IN_PROGRESS', 'PROJECT_COMPLETED', 'REVIEW_SUBMITTED'];
    const warningStates = ['PENDING_INSPECTION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'DESIGN_CREATION', 'DESIGN_SUBMITTED', 'CLIENT_REVIEW', 'QUOTATION_SUBMITTED', 'QUOTATION_VERIFIED', 'CLIENT_COMPARISON', 'CONTRACTOR_SELECTED', 'COMPLETION_VERIFICATION', 'READY_FOR_HANDOVER'];
    
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
    if (successStates.includes(status)) return 'bg-green-100 text-green-700';
    if (warningStates.includes(status)) return "bg-[#FFF7DA] text-[#D97706] border border-[#FDE68A]";
    return 'bg-gray-100 text-gray-700';
  };

const myProjects = projects.filter(
  (project) =>
    project.status === "CONTRACTOR_SELECTED" ||
    project.status === "CONTRACTOR_CONFIRMED"
);

const filteredProjects = myProjects
  .filter((project) => {
    // Status Filter
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : project.status === statusFilter;

    // Search Filter
    const matchesSearch =
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.category.toLowerCase().includes(search.toLowerCase()) ||
      project.city.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  })
  .sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );

      case "budgetHigh":
        return b.budget - a.budget;

      case "budgetLow":
        return a.budget - b.budget;

      case "newest":
      default:
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
    }
  });

const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

const indexOfLastProject = currentPage * projectsPerPage;
const indexOfFirstProject = indexOfLastProject - projectsPerPage;

const currentProjects = filteredProjects.slice(
  indexOfFirstProject,
  indexOfLastProject
);

const awaitingAcceptanceCount = myProjects.filter(
  (project) => project.status === "CONTRACTOR_SELECTED"
).length;

const activeConstructionCount = myProjects.filter(
  (project) => project.status === "CONTRACTOR_CONFIRMED"
).length;

  return (

    <div className="min-h-screen bg-[#F8F8FA] p-8">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#70153A]">
          My Projects
        </h1>

        <p className="text-gray-500 mt-2">
          Projects assigned to you by clients after contractor selection.
        </p>
      </div>

      {/* Stats */}

      {/* Statistics */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

  {/* Total Projects */}

  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">

    <div className="flex items-center gap-4">

      <div className="w-16 h-16 rounded-full bg-[#FDECEC] flex items-center justify-center">
    <Building2
        className="text-[#70153A]"
        size={30}
        strokeWidth={2.2}
    />
</div>

      <div>

        <h3 className="text-lg font-semibold text-gray-800">
          Total Projects
        </h3>

        <h1 className="text-4xl font-bold text-[#70153A]">
  {myProjects.length}
</h1>

        <p className="text-gray-500 text-sm">
          All assigned projects
        </p>

      </div>

    </div>

  </div>

  {/* Awaiting Acceptance */}

  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">

    <div className="flex items-center gap-4">

      <div className="w-16 h-16 rounded-full bg-[#FFF5DA] flex items-center justify-center">
    <Clock3
        className="text-[#D97706]"
        size={30}
        strokeWidth={2.2}
    />
</div>

      <div>

        <h3 className="text-lg font-semibold text-gray-800">
          Awaiting Acceptance
        </h3>

        <h1 className="text-4xl font-bold text-[#70153A]">
  {awaitingAcceptanceCount}
</h1>

        <p className="text-gray-500 text-sm">
          Waiting for contractor acceptance
        </p>

      </div>

    </div>

  </div>

  {/* Active Construction */}

  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">

    <div className="flex items-center gap-4">

      <div className="w-16 h-16 rounded-full bg-[#EAFBF0] flex items-center justify-center">
    <Hammer
        className="text-green-600"
        size={30}
        strokeWidth={2.2}
    />
</div>

      <div>

        <h3 className="text-lg font-semibold text-gray-800">
          Active Construction
        </h3>

        <h1 className="text-4xl font-bold text-[#70153A]">
  {activeConstructionCount}
</h1>

        <p className="text-gray-500 text-sm">
          Projects under construction
        </p>

      </div>

    </div>

  </div>

</div>

      {/* Filters */}

      {/* Filters */}

<div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm mb-8">

  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

    {/* Status Filters */}

    <div className="flex flex-wrap gap-3">

      <button
  onClick={() => setStatusFilter("ALL")}
  className={`px-6 h-12 rounded-full font-semibold shadow-sm transition ${
    statusFilter === "ALL"
      ? "bg-[#70153A] text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`}
>
  All ({myProjects.length})
</button>

      <button
  onClick={() => setStatusFilter("CONTRACTOR_SELECTED")}
  className={`px-6 h-12 rounded-full font-medium transition ${
    statusFilter === "CONTRACTOR_SELECTED"
      ? "bg-[#70153A] text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`}
>
  Awaiting Acceptance ({awaitingAcceptanceCount})
</button>

      <button
  onClick={() => setStatusFilter("CONTRACTOR_CONFIRMED")}
  className={`px-6 h-12 rounded-full font-medium transition ${
    statusFilter === "CONTRACTOR_CONFIRMED"
      ? "bg-[#70153A] text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`}
>
  Active Construction ({activeConstructionCount})
</button>

    </div>

    {/* Search + Sort */}

    <div className="flex flex-col md:flex-row gap-4">

      {/* Search */}

      <div className="relative">

        <input
  type="text"
  placeholder="Search by project name, city..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-80 h-12 rounded-xl border border-gray-200 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#70153A]/20"
/>

        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />

      </div>

      {/* Sort */}

      <select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="h-12 px-5 rounded-xl border border-gray-200 bg-white focus:outline-none"
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="budgetHigh">Budget: High → Low</option>
  <option value="budgetLow">Budget: Low → High</option>
</select>

    </div>

  </div>

</div>

      {/* Cards */}

      {/* Project Cards */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {currentProjects.map((project) => (

<div
  key={project._id}
  className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition"
>

    {/* Header */}

    <div className="flex justify-between items-start">

      <div>

        <h2 className="text-3xl font-bold text-[#70153A]">
  {project.title}
</h2>

        <p className="text-gray-500 mt-1">
          {project.category}
        </p>

      </div>

      <span
  className={`px-4 py-2 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}
>
  {project.status.replaceAll("_", " ")}
</span>

    </div>

    {/* Information */}

    <div className="grid grid-cols-3 gap-5 mt-10 text-center">

      <div>

        <p className="text-xs text-gray-400">
          Budget
        </p>

        <h4 className="font-bold text-green-600 mt-1">
          ₹{project.budget.toLocaleString()}
        </h4>

        

      </div>

      <div>

        <p className="text-xs text-gray-400">
          Square Feet
        </p>

        <h4 className="font-bold mt-1">
          {project.squareFeet}
        </h4>

      </div>

      <div>

        <p className="text-xs text-gray-400">
          City
        </p>

        <h4 className="font-bold mt-1">
          {project.city}
        </h4>

      </div>

    </div>

    {/* Buttons */}

<div className="flex justify-center mt-8">

  <button
    type="button"
    onClick={() => router.push(`/client/my-projects/${project._id}`)}
    className="w-52 h-12 rounded-xl bg-[#70153A] text-white font-semibold hover:bg-[#5E1232] transition-all duration-200"
  >
    View Details
  </button>

</div>

  </div>

  ))}

  {totalPages > 1 && (
  <div className="flex items-center justify-between mt-8">
    <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
    >
      Previous
    </button>

    <div className="flex items-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(index + 1)}
          className={`w-10 h-10 rounded-lg transition ${
            currentPage === index + 1
              ? "bg-[#70153A] text-white"
              : "border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>

    <button
      onClick={() =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
      }
      disabled={currentPage === totalPages}
      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
    >
      Next
    </button>
  </div>
)}

</div>

    </div>
  );
}