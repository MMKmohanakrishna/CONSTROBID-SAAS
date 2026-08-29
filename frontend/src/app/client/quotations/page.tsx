"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, MapPin } from "lucide-react";
import { useRealtimeRefresh } from "@/components/RealtimeSyncProvider";

type StatusFilter = "all" | "open" | "closed";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
];

// A project is closed once its quotation deadline has passed. No deadline set
// means it is still accepting quotes.
function isClosed(project: any) {
  if (!project?.quotationDeadline) return false;
  return new Date(project.quotationDeadline).getTime() < Date.now();
}

export default function ClientQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const router = useRouter();

  useEffect(() => {
    fetchQuotations();
  }, []);

  useRealtimeRefresh(() => fetchQuotations());

  const fetchQuotations = async () => {
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

      setQuotations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // The API returns projects in no particular order, so the newest quotation
  // activity is sorted to the top here.
  const visibleQuotations = quotations
    .filter((project) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        keyword === "" ||
        project.title?.toLowerCase().includes(keyword) ||
        project.city?.toLowerCase().includes(keyword) ||
        project.propertyType?.toLowerCase().includes(keyword);

      if (!matchesSearch) return false;

      if (statusFilter === "open") return !isClosed(project);
      if (statusFilter === "closed") return isClosed(project);
      return true;
    })
    .sort((a, b) => {
      // Fall back to the deadline when a project has no quotations dated yet.
      const aDate = new Date(a.latestQuotationDate || a.quotationDeadline || 0).getTime();
      const bDate = new Date(b.latestQuotationDate || b.quotationDeadline || 0).getTime();
      return bDate - aDate;
    });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 mb-8">

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">
              Project Quotations
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              View, compare and manage contractor quotations for all your projects.
            </p>
          </div>

        </div>

      </div>

{/* Search & Filters */}

<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

    <input
      type="text"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder="Search Project..."
      aria-label="Search projects"
      className="
        w-full
        lg:w-96
        h-12
        rounded-full
        border
        border-gray-300
        px-5
        outline-none
        focus:border-primary
      "
    />

    <div className="flex flex-wrap gap-3">

      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => setStatusFilter(filter.key)}
          aria-pressed={statusFilter === filter.key}
          className={`px-6 h-11 rounded-full transition-all ${
            statusFilter === filter.key
              ? "bg-primary text-white"
              : "bg-gray-100 hover:bg-primary hover:text-white"
          }`}
        >
          {filter.label}
        </button>
      ))}

    </div>

  </div>

</div>
{loading ? (

  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
    Loading quotations...
  </div>

) : visibleQuotations.length === 0 ? (

  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
    {quotations.length === 0
      ? "No quotations received yet."
      : "No projects match this search or filter."}
  </div>

) : (

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

  {visibleQuotations.map((project) => (

    <div
      key={project.projectId}
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-300
        p-6
        flex
        flex-col
        justify-between
      "
    >

      <div>

        <h2 className="text-xl font-bold text-primary">
          {project.title}
        </h2>

        <p className="mt-1 flex items-center gap-1.5 text-gray-500">
          <Building size={14} />
          {project.propertyType}
        </p>

        <p className="flex items-center gap-1.5 text-gray-500">
          <MapPin size={14} />
          {project.city}
        </p>

        <div className="border-t my-5"></div>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between">
            <span>Received Quotes</span>
            <span className="font-bold">
              {project.quotationCount}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Lowest Quote</span>
            <span className="font-bold text-green-600">
              ₹{project.lowestQuote?.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Highest Quote</span>
            <span className="font-bold text-primary">
              ₹{project.highestQuote?.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Latest Quote</span>
            <span className="font-semibold">
              {project.latestQuotationDate
                ? new Date(project.latestQuotationDate).toLocaleDateString()
                : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Deadline</span>
            <span className="font-semibold">
              {project.quotationDeadline
                ? new Date(project.quotationDeadline).toLocaleDateString()
                : "-"}
            </span>
          </div>

        </div>

      </div>

      <button
  onClick={() =>
    router.push(
      `/client/dashboard?tab=bidding&project=${project.projectId}`
    )
  }
  className="
    mt-6
    w-full
    h-11
    rounded-xl
    bg-primary
    text-white
    font-semibold
    hover:bg-primary-hover
    transition-all
  "
>
  View Quotations
</button>

    </div>

  ))}

</div>

)}

</div>
  );
}