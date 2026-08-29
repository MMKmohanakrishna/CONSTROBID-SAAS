"use client";

import { useEffect, useState } from "react";
import { apiRequest, projectApi, variationApi } from "@/lib/api";
import { useRealtimeRefresh } from "@/components/RealtimeSyncProvider";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye } from "lucide-react";
import {
  ArrowLeft,
  Building2,
  IndianRupee,
  CalendarDays,
  BadgeCheck,
  Download,
  ChevronRight,
  Package,
  FolderKanban,
  ClipboardList,
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

export default function ClientProjectDetails() {

    const { projectId, quoteId } = useParams();
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [variations, setVariations] = useState<any[]>([]);
    const [quotation, setQuotation] = useState<any>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMaterialsView, setIsMaterialsView] = useState(false);


    const [showPaymentModal, setShowPaymentModal] = useState(false);

const [paymentAmount, setPaymentAmount] = useState(0);

const [transactionId, setTransactionId] = useState("");

const [paymentMethod, setPaymentMethod] = useState("UPI");

const [paymentNote, setPaymentNote] = useState("");

const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

    const materials: Material[] = Array.isArray(quotation?.materials)
      ? quotation.materials
      : [];
    const approvedVariationMaterials: Material[] = variations
  .filter((v) => v.status === "APPROVED")
  .map((v) => ({
    _id: v._id,
    id: v._id,
    name: v.title,
    amount: Number(v.requestedAmount || 0),
  }));
  
  const baseMaterialTotal = materials.reduce(
  (total, material) => total + Number(material.amount || 0),
  0
);

const approvedVariationTotal = approvedVariationMaterials.reduce(
  (total, material) => total + Number(material.amount || 0),
  0
);

const materialTotal =
  baseMaterialTotal + approvedVariationTotal;

const grandTotal =
    Number(quotation?.labourCost || 0) +
    Number(quotation?.electricalCost || 0) +
    Number(quotation?.plumbingCost || 0) +
    Number(quotation?.paintingCost || 0) +
    Number(quotation?.falseCeilingCost || 0) +
    materialTotal +
    Number(
        quotation?.extraCharges?.reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0
        ) || 0
    );

    const paymentRecords = Array.isArray(project?.payments)
      ? project.payments
      : Array.isArray(project?.invoices)
      ? project.invoices
      : [];

    const totalPaid = paymentRecords.reduce(
      (total: number, payment: any) =>
        total + (Number(payment.amount || payment.total || 0) || 0),
      0
    );

    const paymentTarget = Number(quotation?.grandTotal || project?.budget || 0);
    const paymentDue = Math.max(paymentTarget - totalPaid, 0);

    useEffect(() => {
    setPaymentAmount(paymentDue);
}, [paymentDue]);

    const paymentStatus = paymentDue === 0 ? "Paid" : "Pending";
    const paymentTerms = project?.paymentTerms || quotation?.paymentTerms || "30-40-30 milestone structure";

    // Only what the client themselves uploaded. `project.files` also holds the
    // inspector's DESIGN and BOQ uploads, which belong in their own cards.
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
            const attendanceResponse: any = await apiRequest(
  `/attendance/${data._id || data.id}/today`
);

console.log("Attendance Response:", attendanceResponse);

setTodayAttendance(attendanceResponse.attendance);

console.log("URL Quote ID:", quoteId);

data.quotations.forEach((q: any) => {
    console.log("Quotation ID:", q._id);
});

const selectedQuote =
  data.quotations.find(
    (q: any) => String(q._id) === String(data.selectedQuotation)
  ) || data.quotations[0];

console.log("SELECTED QUOTE:");
console.log(selectedQuote);

            setQuotation(selectedQuote);
            const variationResponse: any = await variationApi.list(
  data._id || data.id
);

setVariations(
  Array.isArray(variationResponse?.variations)
    ? variationResponse.variations
    : []
);
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
  <div className="min-h-screen bg-slate-100">

  <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">

    {/* Header */}

    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3 sm:gap-5">

        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="h-12 w-12 shrink-0 rounded-xl border bg-white shadow-sm flex items-center justify-center hover:bg-slate-50"
        >
          <ArrowLeft size={22} />
        </button>

        <div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#70153A]">
            Project Details
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Complete overview of your project, construction progress, documents and inspection details.
          </p>

        </div>

      </div>

      <div className="flex gap-3">

      </div>

    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

    {/* Project Details */}

  <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border p-5 sm:p-8">

    <div className="flex items-center gap-4">

      <div className="h-20 w-20 rounded-2xl bg-[#70153A]/10 flex items-center justify-center">

        <ClipboardList
  size={40}
  className="text-[#70153A]"
/>

      </div>

      <div>

        <h2 className="text-3xl font-bold text-[#1F2937]">
  {project?.title || "--"}
</h2>

<p className="text-slate-500 mt-1">
  Project
</p>

      </div>

    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">

  <div>
    <p className="text-xs uppercase text-slate-400">
      Category
    </p>
    <p className="font-bold">
      {project?.category || "--"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase text-slate-400">
      Property
    </p>
    <p className="font-bold">
      {project?.propertyType || "--"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase text-slate-400">
      Area
    </p>
    <p className="font-bold">
      {project?.squareFeet || "--"} sq.ft
    </p>
  </div>

  <div>
    <p className="text-xs uppercase text-slate-400">
      Budget
    </p>
    <p className="font-bold text-green-600">
      ₹{project?.budget?.toLocaleString() || "--"}
    </p>
  </div>

  <div>
    <p className="text-xs uppercase text-slate-400">
      City
    </p>
    <p className="font-bold">
      {project?.city || "--"}
    </p>
  </div>
</div>

  </div>

  

  {/* Summary */}

  <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border p-5 sm:p-8">

    <h2 className="text-xl font-bold text-[#70153A]">
  Project Summary
</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 mt-8">

  {/* Company */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Company
    </p>
    <p className="mt-1 text-lg font-semibold text-slate-900">
      {quotation?.contractorId?.companyName || "--"}
    </p>
  </div>

  {/* Project */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Project
    </p>
    <p className="mt-1 text-lg font-semibold text-slate-900">
      {project?.title || "--"}
    </p>
  </div>

  {/* Budget */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Budget
    </p>
    <p className="mt-1 text-3xl font-bold text-green-600">
      ₹{project?.budget?.toLocaleString() || "--"}
    </p>
  </div>

  {/* Area */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Area
    </p>
    <p className="mt-1 text-2xl font-bold text-slate-900">
      {project?.squareFeet || "--"} sq.ft
    </p>
  </div>

  {/* Status */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Status
    </p>
    <p className="mt-1 font-semibold text-[#70153A]">
      {project?.status
        ?.replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || "--"}
    </p>
  </div>

  {/* Created */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Created
    </p>

    <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
      <CalendarDays size={18} />
      <span>
        {project?.createdAt
          ? new Date(project.createdAt).toLocaleDateString()
          : "--"}
      </span>
    </div>
  </div>

</div>
    </div>

  {/* Visit Site */}
<div className="lg:col-span-3 space-y-6">

  <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border p-6">

    <h2 className="text-xl font-bold text-[#70153A] mb-6">
      Site Visit
    </h2>

    <div className="space-y-4">

      <div
        className={`rounded-xl border p-4 ${
          project?.contractorSiteVisited
            ? "border-green-200 bg-green-50"
            : "border-yellow-200 bg-yellow-50"
        }`}
      >

        <p className="text-xs text-slate-500">
          Visit Status
        </p>

        <div className="mt-2 flex items-center gap-2">

          <div
            className={`h-3 w-3 rounded-full ${
              project?.contractorSiteVisited
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          />

          <span
            className={`text-xl font-bold ${
              project?.contractorSiteVisited
                ? "text-green-600"
                : "text-yellow-700"
            }`}
          >
            {project?.contractorSiteVisited
              ? "Visit Completed"
              : "Visit Pending"}
          </span>

        </div>

      </div>

      <div className="rounded-xl border p-4">

        <p className="text-xs text-slate-500">
          Visit Date
        </p>

        <p className="mt-2 font-semibold">
          {project?.contractorSiteVisitedAt
            ? new Date(project.contractorSiteVisitedAt).toLocaleString()
            : "Not Started"}
        </p>

      </div>

    </div>

  </div>

</div>
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

    {/* Attachments */}
    <div className="lg:col-span-3 space-y-6">
<div className="bg-white rounded-3xl border shadow-sm p-5 sm:p-8">
      <h2 className="text-xl font-bold text-[#70153A] mb-6">

        Quotation Attachments

      </h2>

      
       <div className="space-y-3">

  {/* Only the ConstroBID team quotation is shown here. The contractor's own
      quotation files are internal to the inspection review. */}
  {quotation?.constrobidQuotation ? (

    <div className="flex items-center justify-between rounded-xl border p-4">

      <span className="font-semibold">
        {quotation.constrobidQuotationName || "ConstroBID Quotation"}
      </span>

      <a
        href={quotation.constrobidQuotation}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#70153A] font-semibold hover:underline"
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
    {/* Project Documents */}

<div className="hidden bg-white rounded-3xl border shadow-sm p-6">
  <h2 className="mb-6 text-xl font-bold text-[#70153A]">
    Contractor Attendance
  </h2>

  <div className="space-y-4">

    <div className="space-y-5">

      <div
        className={`rounded-xl border p-4 ${
          todayAttendance ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }`}
      >

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Today's Status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  todayAttendance ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>

              <span
                className={`text-2xl font-bold ${
                  todayAttendance ? "text-green-600" : "text-red-600"
                }`}
              >
                {todayAttendance ? "Present" : "Absent"}
              </span>
            </div>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              todayAttendance
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {todayAttendance ? "Present Today" : "Not Checked In"}
          </div>

        </div>

      </div>

      <div className="rounded-xl border p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-slate-500">Check In</p>
            <p className="mt-1 font-semibold">
              {todayAttendance?.checkInTime
                ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-- : --"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Date</p>
            <p className="mt-1 font-semibold">
              {todayAttendance?.attendanceDate
                ? new Date(todayAttendance.attendanceDate).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 ${
          todayAttendance ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            todayAttendance ? "text-green-700" : "text-red-700"
          }`}
        >
          {todayAttendance
            ? "Contractor is checked in today."
            : "Contractor has not checked in today."}
        </p>
      </div>

      <button
        onClick={() => router.push(`/client/my-projects/${projectId}/attendance`)}
        className="w-full rounded-xl bg-[#70153A] py-3 font-semibold text-white transition hover:bg-[#5d1031]"
      >
        View Attendance History
      </button>

    </div>

  </div>

</div>
</div>
    <div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">

<h2 className="text-xl font-bold text-[#70153A] mb-6">
Client Requirements
</h2>

<div className="space-y-4 text-sm">

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
<div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">

  <h2 className="text-xl font-bold text-[#70153A] mb-6">
    Client Uploads
  </h2>

  <div className="mt-6">

    {clientUploads.length ? (

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {clientUploads.map((file: any, index: number) => (
          <a
            key={file._id || index}
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border overflow-hidden hover:shadow-md transition"
          >
            {file.fileType === "IMAGE" ? (
              <img
                src={file.fileUrl}
                alt={file.meta?.originalName || `Client upload ${index + 1}`}
                className="w-full h-36 object-cover"
              />
            ) : (
              <div className="w-full h-36 flex items-center justify-center bg-slate-50 text-4xl">
                📄
              </div>
            )}

            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-semibold truncate pr-2">
                {file.meta?.originalName || `File ${index + 1}`}
              </span>

              <span className="text-[#70153A] text-sm font-semibold shrink-0">
                View
              </span>
            </div>
          </a>
        ))}

      </div>

    ) : (
      <p className="text-slate-400">
        No Files Uploaded
      </p>
    )}

</div>

</div>
<div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">

  <h2 className="text-xl font-bold text-[#70153A] mb-6">
    Approved Design
  </h2>

  {project?.designFiles?.length ? (

    <>
    <div className="space-y-3">

  <div className="flex items-center justify-between rounded-xl border p-4">

    <span className="font-semibold">
      Approved Design
    </span>

    <a
      href={project.designFiles[0].fileUrl || project.designFiles[0].url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#70153A] font-semibold hover:underline"
    >
      View
    </a>

  </div>

</div>

    </>

  ) : (

    <div className="h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400">

  <div className="text-6xl">
    🏗️
  </div>

  <p className="mt-4 font-semibold">
    No Approved Design Available
  </p>

</div>

  )}

</div>

  <div className="hidden lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">

    <div className="flex items-center gap-4">

    <div className="h-10 w-10 rounded-xl bg-[#70153A]/10 flex items-center justify-center">

        <IndianRupee
            size={20}
            className="text-[#70153A]"
        />

    </div>

    <div>

        <h2 className="text-lg font-bold text-[#70153A]">
            Payment Summary
        </h2>

        <p className="text-xs text-slate-500">
            Current Project Payment
        </p>

    </div>

</div>

<div className="mt-5 space-y-3">

    <div className="flex justify-between">

        <span className="text-slate-500">
            Total Contract
        </span>

        <span className="font-semibold text-base">
            ₹{paymentTarget.toLocaleString()}
        </span>

    </div>

    <div className="flex justify-between">

        <span className="text-slate-500">
            Paid
        </span>

        <span className="font-semibold text-base text-green-600">
            ₹{totalPaid.toLocaleString()}
        </span>

    </div>

    <div className="flex justify-between border-b pb-1">

        <span className="text-slate-500">
            Remaining
        </span>

        <span className="font-semibold text-base text-red-600">
            ₹{paymentDue.toLocaleString()}
        </span>

    </div>

</div>

<div className="mt-2 rounded-xl bg-slate-50 border p-2">

    <div className="flex items-center justify-between">

        <span className="text-slate-500">
            Status
        </span>

        <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                paymentDue === 0
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
            }`}
        >
            {paymentStatus}
        </span>

    </div>

    <div className="mt-5">

        <p className="text-xs uppercase tracking-wide text-slate-400">
            Payment Terms
        </p>

        <p className="mt-1 text-sm text-slate-600">
            {paymentTerms}
        </p>

    </div>

</div>

<button
    onClick={() => setShowPaymentModal(true)}
    className="mt-7 w-full rounded-xl bg-[#70153A] py-3 font-semibold text-white transition hover:bg-[#5d1031]"
>
    Make Payment
</button>
  </div>

<div className="lg:col-span-12">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
    <div className="lg:col-span-3 bg-white rounded-2xl border shadow-sm p-5">
      
      <h2 className="text-xl font-bold text-[#70153A] mb-6">
        Inspection Summary
      </h2>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-semibold text-green-600">
            {project?.inspectionCompleted ? "Completed" : "Pending"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Inspector Approved</span>
          <span>
            {project?.inspectorApproved ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Inspection Date</span>
          <span>
            {project?.inspectorApprovedAt
              ? new Date(project.inspectorApprovedAt).toLocaleDateString()
              : "-"}
          </span>
        </div>
      </div>
    </div>

    <div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">
      <h2 className="text-xl font-bold text-[#70153A] mb-6">
        Inspection Photos
      </h2>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-3">

  {project?.inspectionPhotos?.length ? (

    project.inspectionPhotos.map((photo: string, index: number) => (

      <div
        key={index}
        className="flex items-center justify-between rounded-xl border p-4"
      >

        <span className="font-semibold">
          {`Inspection Photo ${index + 1}`}
        </span>

        <a
          href={photo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#70153A] font-semibold hover:underline"
        >
          View
        </a>

      </div>

    ))

  ) : (

    <p className="text-slate-400">
      No Inspection Photos
    </p>

  )}

</div>
      </div>
    </div>

    <div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">
      <h2 className="text-xl font-bold text-[#70153A] mb-6">
        Inspection Report
      </h2>

      <div className="space-y-3">

  {project?.inspectionReportPdf ? (

    <div className="flex items-center justify-between rounded-xl border p-4">

      <span className="font-semibold">
        Inspection Report
      </span>

      <a
        href={project.inspectionReportPdf}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#70153A] font-semibold hover:underline"
      >
        View
      </a>

    </div>

  ) : (

    <p className="text-slate-400">
      No Inspection Report
    </p>

  )}

</div>
    </div>

    <div className="lg:col-span-3 bg-white rounded-3xl border shadow-sm p-5 sm:p-8">
      <h2 className="text-xl font-bold text-[#70153A] mb-6">
  Inspector Notes
</h2>
      
<div className="rounded-xl border p-4 min-h-[180px]">

  {project?.inspectionNotes ? (

    <p className="text-slate-700 whitespace-pre-wrap leading-7">
      {project.inspectionNotes}
    </p>

  ) : (

    <p className="text-slate-400">
      No Inspector Notes
    </p>

  )}

</div>
    </div>
  </div>
</div>


</div>   {/* grid grid-cols-12 */}

</div>   {/* max-w-[1700px] */}

{showPaymentModal && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">

<h2 className="text-2xl font-bold text-[#70153A]">
Make Payment
</h2>

<p className="mt-1 text-sm text-slate-500">
Upload your payment proof after completing the transfer.
</p>

<div className="mt-1 space-y-1">

<div>

<label className="text-sm font-medium">
Payment Amount
</label>

<input
type="number"
value={paymentAmount}
onChange={(e)=>setPaymentAmount(Number(e.target.value))}
className="mt-2 w-full rounded-xl border p-3"
/>

</div>

<div>

<label className="text-sm font-medium">
Payment Method
</label>

<select
value={paymentMethod}
onChange={(e)=>setPaymentMethod(e.target.value)}
className="mt-2 w-full rounded-xl border p-3"
>

<option>UPI</option>

<option>Bank Transfer</option>

<option>NEFT</option>

<option>RTGS</option>

<option>Cheque</option>

</select>

</div>

<div>

<label className="text-sm font-medium">
Transaction ID
</label>

<input
value={transactionId}
onChange={(e)=>setTransactionId(e.target.value)}
className="mt-2 w-full rounded-xl border p-3"
/>

</div>

<div>

<label className="text-sm font-medium">
Upload Payment Screenshot
</label>

<input
type="file"
accept="image/*"
onChange={(e)=>
setPaymentScreenshot(
e.target.files?.[0] || null
)
}
className="mt-2 block w-full"
/>

</div>

<div>

<label className="text-sm font-medium">
Notes
</label>

<textarea
rows={4}
value={paymentNote}
onChange={(e)=>setPaymentNote(e.target.value)}
className="mt-2 w-full rounded-xl border p-3"
/>

</div>

</div>

<div className="mt-8 flex justify-end gap-3">

<button
onClick={()=>setShowPaymentModal(false)}
className="rounded-xl border px-6 py-3"
>

Cancel

</button>

<button
className="rounded-xl bg-[#70153A] px-8 py-3 text-white"
>

Submit Payment

</button>

</div>

</div>

</div>

)}

</div>
);
}
