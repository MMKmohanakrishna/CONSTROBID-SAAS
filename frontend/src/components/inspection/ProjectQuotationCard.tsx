"use client";
import Link from "next/link";

interface ProjectQuotationCardProps {
  project: {
    projectId: string;

    title: string;
    propertyType: string;
    city: string;
    clientName: string;

    totalQuotes: number;
    pendingQuotes: number;
    verifiedQuotes: number;
    rejectedQuotes: number;

    lowestQuote: number;
    highestQuote: number;

    submittedToday: number;

    quotationDeadline: string;
  };
}


// Anything still awaiting review outranks the rest — the inspector needs to act
// on it. Only once nothing is pending does the project read as Verified.
function getStatus(project: ProjectQuotationCardProps["project"]) {
  if (project.pendingQuotes > 0) {
    return { label: "Pending Verification", className: "bg-amber-100 text-amber-700" };
  }

  if (project.verifiedQuotes > 0) {
    return { label: "Verified", className: "bg-green-100 text-green-700" };
  }

  if (project.rejectedQuotes > 0) {
    return { label: "Rejected", className: "bg-red-100 text-red-700" };
  }

  return { label: "No Quotes", className: "bg-slate-100 text-slate-600" };
}

export default function ProjectQuotationCard({
  project,
}: ProjectQuotationCardProps) {
  const status = getStatus(project);

  return (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-300">

    {/* Header */}
    <div className="flex items-start justify-between">

      <div>
        <h2 className="text-2xl font-bold text-primary">
          {project.title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {project.propertyType} • {project.city}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-700">
  Client: <span className="font-semibold">{project.clientName}</span>
</p>
      </div>

      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
        {status.label}
      </span>

    </div>

    {/* Statistics */}
    <div className="grid grid-cols-4 gap-3 mt-5">

      <div className="rounded-xl bg-slate-50 p-3 text-center">
        <p className="text-xs text-slate-500">Quotes</p>
        <h3 className="text-lg font-bold">
          {project.totalQuotes}
        </h3>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 text-center">
        <p className="text-xs text-amber-700">Pending</p>
        <h3 className="text-lg font-bold text-amber-700">
          {project.pendingQuotes}
        </h3>
      </div>

      <div className="rounded-xl bg-green-50 p-3 text-center">
        <p className="text-xs text-green-700">Verified</p>
        <h3 className="text-lg font-bold text-green-700">
          {project.verifiedQuotes}
        </h3>
      </div>

      <div className="rounded-xl bg-red-50 p-3 text-center">
        <p className="text-xs text-red-700">Rejected</p>
        <h3 className="text-lg font-bold text-red-700">
          {project.rejectedQuotes}
        </h3>
      </div>

    </div>

    {/* Quote Values */}
    <div className="flex justify-between items-center mt-5 border-t pt-4">

      <div>
        <p className="text-xs text-slate-500">
          Lowest Quote
        </p>

        <h3 className="text-xl font-bold text-green-600">
          ₹{project.lowestQuote.toLocaleString()}
        </h3>
      </div>

      <div className="text-right">
        <p className="text-xs text-slate-500">
          Highest Quote
        </p>

        <h3 className="text-xl font-bold text-red-600">
          ₹{project.highestQuote.toLocaleString()}
        </h3>
      </div>

    </div>

    {/* Footer */}
    <div className="flex items-center justify-between mt-5 border-t pt-4">

      <div>

        <p className="text-xs text-slate-500 font-bold">
          Deadline
        </p>

        <p className="font-bold text-red-600">
          {project.quotationDeadline
            ? new Date(project.quotationDeadline).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Not Set"}
        </p>

      </div>

      <Link
        href={`/inspection/bids/${project.projectId}`}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
      >
        View →
      </Link>

    </div>

  </div>
);
}