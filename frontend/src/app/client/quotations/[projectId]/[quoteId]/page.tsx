"use client";

import { useEffect, useState } from "react";
import { projectApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/components/RealtimeSyncProvider";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  IndianRupee,
  CalendarDays,
  BadgeCheck,
  ChevronRight,
  Package,
} from "lucide-react";

type Material = {
  _id?: string;
  id?: string | number;
  name?: string;
  amount?: number;
};

type CostBreakdownRowProps = {
  label: string;
  value: number;
  onClick?: () => void;
  icon?: React.ReactNode;
};

function CostBreakdownRow({
  label,
  value,
  onClick,
  icon,
}: CostBreakdownRowProps) {
  const content = (
    <>
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="flex items-center justify-end gap-2 font-semibold text-green-600">
        ₹{Number(value || 0).toLocaleString()}
        {onClick && <ChevronRight className="h-4 w-4" />}
      </span>
    </>
  );

  const className = "grid grid-cols-2 border-t px-5 py-4 text-left transition hover:bg-slate-50";

  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} w-full`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function CostBreakdownTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-2 border-t bg-[#70153A]/5 px-5 py-5">
      <span className="text-lg font-bold">{label}</span>
      <span className="text-right text-2xl font-bold text-[#70153A]">
        ₹{Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

export default function ClientQuotationDetails() {

    const { projectId, quoteId } = useParams();
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [quotation, setQuotation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMaterialsView, setIsMaterialsView] = useState(false);
    const [resourceTab, setResourceTab] = useState<"design" | "uploads" | "inspection">("design");

    const materials: Material[] = Array.isArray(quotation?.materials)
      ? quotation.materials
      : [];
    const materialTotal = materials.reduce(
      (total, material) => total + Number(material.amount || 0),
      0
    );

    // Only what the client themselves uploaded when posting the requirement.
    // `project.files` also holds the inspector's DESIGN and BOQ uploads, which
    // belong in their own cards.
    const clientUploads = (project?.files || []).filter(
      (file: any) => file.uploadedBy === "CLIENT"
    );

    useEffect(() => {

        loadData();

    }, []);

    useRealtimeRefresh(() => loadData());

    const loadData = async () => {

        try {

            const data = await projectApi.getById(projectId as string);

            setProject(data);

            console.log("URL Quote ID:", quoteId);

data.quotations.forEach((q: any) => {
    console.log("Quotation ID:", q._id);
});

const selectedQuote = data.quotations.find(
    (q: any) => String(q._id) === String(quoteId)
);

console.log("SELECTED QUOTE:");
console.log(selectedQuote);

            setQuotation(selectedQuote);
            console.log("MATERIALS");
console.log(selectedQuote.materials);
            console.log("quoteId from URL:", quoteId);

console.log(
  "Quotation IDs:",
  data.quotations.map((q: any) => q._id)
);

console.log("Selected Quote:", selectedQuote);
        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };
    const handleSelectContractor = async () => {

  try {

    console.log("Select Contractor Clicked");

    await projectApi.selectQuote(
  projectId as string,
  quoteId as string
);

await loadData();

alert("Contractor selected successfully.");

  } catch (err) {

    console.log(err);

    alert("Failed");

  }

};

    if (loading) {

        return <div className="p-10">Loading...</div>;

    }

   return (
  <div className="min-h-screen w-full overflow-x-hidden bg-slate-100">

  <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-8 space-y-8">

    {/* Header */}

    <div className="flex items-center justify-between">

      <div className="flex items-center gap-5">

        <button
          onClick={() => router.back()}
          className="h-12 w-12 rounded-xl border bg-white shadow-sm flex items-center justify-center hover:bg-slate-50"
        >
          <ArrowLeft size={22} />
        </button>

        <div>

          <h1 className="text-4xl font-bold text-[#70153A]">
            Quotation Details
          </h1>

          <p className="text-slate-500 mt-1">
            Complete quotation review submitted by contractor
          </p>

        </div>

      </div>

    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

  {/* Contractor */}

  <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border p-8">

    <div className="flex items-center gap-4">

      <div className="h-20 w-20 rounded-2xl bg-[#70153A]/10 flex items-center justify-center">

        <Building2
          size={40}
          className="text-[#70153A]"
        />

      </div>

      <div>

        <h2 className="text-2xl font-bold">

          {quotation?.contractorId?.companyName}

        </h2>

        <p className="text-slate-500">

          {quotation?.contractorId?.name}

        </p>

      </div>

    </div>

    <div className="grid grid-cols-2 gap-5 mt-8">

      <div>

        <p className="text-xs uppercase text-slate-400">

          Experience

        </p>

        <p className="font-bold text-lg">

          {quotation?.contractorId?.experience} Years

        </p>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          City

        </p>

        <p className="font-bold">

          {quotation?.contractorId?.serviceCities?.[0]}

        </p>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          Phone

        </p>

        <p className="font-bold">

          {quotation?.contractorId?.phone}

        </p>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          Email

        </p>

        <p className="font-bold">

          {quotation?.contractorId?.email}

        </p>

      </div>

    </div>

  </div>

  

  {/* Summary */}

  <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border p-8">

    <h2 className="text-xl font-bold text-[#70153A]">

      Quotation Summary

    </h2>

    <div className="grid grid-cols-2 gap-6 mt-8">

      <div>

        <p className="text-xs uppercase text-slate-400">

          Grand Total

        </p>

        <p className="text-3xl font-bold text-green-600">

          ₹{quotation?.grandTotal?.toLocaleString()}

        </p>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          Validity

        </p>

        <p className="text-xl font-bold">

          {quotation?.validityDays} Days

        </p>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          Status

        </p>

        <div className="flex items-center gap-2">

          <BadgeCheck
            className="text-green-600"
            size={18}
          />

          <span>

            {quotation?.isVerified
              ? "Verified"
              : "Pending"}

          </span>

        </div>

      </div>

      <div>

        <p className="text-xs uppercase text-slate-400">

          Submitted

        </p>

        <div className="flex items-center gap-2">

          <CalendarDays size={18} />

          {new Date(
            quotation?.createdAt
          ).toLocaleDateString()}

        </div>

      </div>

    </div>

  </div>

  {/* Actions */}

  <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border p-8">

    <h2 className="text-xl font-bold text-[#70153A]">

      Actions

    </h2>

    <div className="space-y-4 mt-8">

      {(() => {
  // project.status flips to CONTRACTOR_SELECTED for the whole project the
  // moment ANY quotation is chosen, so it can't tell one quotation's page
  // apart from another's. Only quotation.selected (or matching the
  // project's stored selectedQuotation id) identifies THIS one as the winner.
  const isThisSelected =
    !!quotation?.selected ||
    (!!project?.selectedQuotation &&
      String(project.selectedQuotation) === String(quotation?._id || quoteId));

  const CONTRACTOR_CHOSEN_STATUSES = [
    'CONTRACTOR_SELECTED',
    'CONTRACTOR_CONFIRMED',
    'WORK_STARTED',
    'IN_PROGRESS',
    'COMPLETION_VERIFICATION',
    'READY_FOR_HANDOVER',
    'PROJECT_COMPLETED',
  ];
  const anotherContractorChosen =
    !isThisSelected && CONTRACTOR_CHOSEN_STATUSES.includes(project?.status);

  if (isThisSelected) {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold cursor-not-allowed transition"
      >
        ✓ Contractor Selected
      </button>
    );
  }

  if (anotherContractorChosen) {
    return (
      <button
        disabled
        title="A different contractor has already been selected for this project"
        className="w-full rounded-xl bg-slate-300 py-3 text-slate-600 font-semibold cursor-not-allowed transition"
      >
        Another Contractor Selected
      </button>
    );
  }

  return (
    <button
      onClick={handleSelectContractor}
      className="w-full rounded-xl bg-[#70153A] py-3 text-white font-semibold transition hover:bg-[#5d1031]"
    >
      Select Contractor
    </button>
  );
})()}

      </div>
      

    </div>

  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

    {/* Attachments */}

    <div className="col-span-12 bg-white rounded-3xl border shadow-sm p-8">

      <h2 className="text-xl font-bold text-[#70153A] mb-6">

        Attachments

      </h2>

      
       <div className="space-y-3">

  {/* Only the ConstroBID team quotation is shown here. The contractor's own
      quotation files are internal to the inspection review. */}
  {quotation?.constrobidQuotation ? (

    <div className="flex items-center justify-between gap-3 rounded-xl border p-4">

      <span className="min-w-0 flex-1 truncate font-semibold">
        {quotation.constrobidQuotationName || "ConstroBID Quotation"}
      </span>

      <a
        href={quotation.constrobidQuotation}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[#70153A] font-semibold hover:underline"
      >
        View
      </a>

    </div>

  ) : (

    <p className="text-slate-400">
      No quotation attachment uploaded
    </p>

  )}

</div>

    </div>
<div className="col-span-12">
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
    <h2 className="text-xl font-bold text-[#70153A]">Project Resources</h2>

    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-2">
      {[
        { id: "design", label: "Design" },
        { id: "uploads", label: "Uploads" },
        { id: "inspection", label: "Inspection" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setResourceTab(tab.id as "design" | "uploads" | "inspection")}
          className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            resourceTab === tab.id
              ? "bg-[#70153A] text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
</div>

{resourceTab === "design" && (
  <div className="col-span-12">
    <div className="bg-white rounded-3xl border border-gray-200 p-5">
      <h2 className="text-xl font-bold text-[#70153A] mb-5">Approved Design</h2>

      {project?.designFiles?.length ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <span className="min-w-0 flex-1 truncate font-semibold">Approved Design</span>
          <a
            href={project.designFiles[0].fileUrl || project.designFiles[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-[#70153A] px-5 py-2 font-semibold text-white hover:bg-[#5B0D28]"
          >
            View
          </a>
        </div>
      ) : (
        <div className="h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400">
          <div className="text-5xl">🏗️</div>
          <p className="mt-4 font-semibold">No Approved Design Available</p>
        </div>
      )}
    </div>
  </div>
)}

{resourceTab === "uploads" && (
  <div className="col-span-12 space-y-6">
    <div className="bg-white rounded-3xl border border-gray-200 p-5">
      <h2 className="text-xl font-bold text-[#70153A] mb-5">Client Uploads</h2>

      {clientUploads.length ? (
        <div className="space-y-3">
          {clientUploads.map((file: any, index: number) => (
            <div
              key={file._id || index}
              className="flex items-center justify-between gap-3 rounded-xl border p-4"
            >
              <span className="min-w-0 flex-1 truncate font-semibold">
                {file.meta?.originalName || `File ${index + 1}`}
              </span>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-[#70153A] px-5 py-2 font-semibold text-white hover:bg-[#5B0D28]"
              >
                View
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8">No Files Uploaded</p>
      )}
    </div>

    <div className="bg-white rounded-3xl border border-gray-200 p-5">
      <h2 className="text-xl font-bold text-[#70153A] mb-5">Client Requirements</h2>

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Project</span>
          <span className="font-semibold">{project?.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Category</span>
          <span>{project?.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Property</span>
          <span>{project?.propertyType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Area</span>
          <span>{project?.squareFeet} sq.ft</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Budget</span>
          <span>₹{project?.budget?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">City</span>
          <span>{project?.city}</span>
        </div>
      </div>
    </div>
  </div>
)}

{resourceTab === "inspection" && (
  <div className="col-span-12">
    <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-6">
      <h2 className="text-xl font-bold text-[#70153A]">Inspection Details</h2>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-xs uppercase text-slate-400">Status</p>
          <p className="mt-1 font-semibold text-green-600">
            {project?.inspectionCompleted ? "Completed" : "Pending"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Inspector Approved</p>
          <p className="mt-1 font-semibold">{project?.inspectorApproved ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Inspection Date</p>
          <p className="mt-1 font-semibold">
            {project?.inspectorApprovedAt
              ? new Date(project.inspectorApprovedAt).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </div>

      {project?.inspectionPhotos?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Inspection Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {project.inspectionPhotos.map((photo: string, index: number) => (
              <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                <img
                  src={photo}
                  alt={`Inspection photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition cursor-pointer"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {project?.inspectionReportPdf && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Inspection Report</h3>
          <a
            href={project.inspectionReportPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border p-4 hover:bg-slate-50"
          >
            <span className="font-semibold">Inspection Report</span>
            <span className="text-[#70153A] font-semibold">View</span>
          </a>
        </div>
      )}

      {project?.inspectionNotes && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Inspector Notes</h3>
          <div className="rounded-xl border p-4 bg-slate-50">
            <p className="text-slate-700 whitespace-pre-wrap leading-7 text-sm">
              {project.inspectionNotes}
            </p>
          </div>
        </div>
      )}

      {!project?.inspectionPhotos?.length &&
        !project?.inspectionReportPdf &&
        !project?.inspectionNotes && (
          <p className="text-slate-400 text-sm text-center py-8">
            No inspection details available yet.
          </p>
        )}
    </div>
  </div>
)}

</div>   {/* grid grid-cols-12 */}

</div>   {/* max-w-[1700px] */}

</div>
);
}
