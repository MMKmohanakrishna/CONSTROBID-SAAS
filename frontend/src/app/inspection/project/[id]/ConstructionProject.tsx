"use client";

import { useEffect, useState } from "react";
import { apiRequest, projectApi, variationApi } from "@/lib/api";
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
  User,
  Phone,
  Mail,
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

    const params = useParams();

const projectId = params.id as string;
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [quotation, setQuotation] = useState<any>(null);
    const [todayAttendance, setTodayAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isMaterialsView, setIsMaterialsView] = useState(false);
    const [variations, setVariations] = useState<any[]>([]);
    const [processingVariationId, setProcessingVariationId] = useState<string | null>(null);

    const materials: Material[] = Array.isArray(quotation?.materials)
      ? quotation.materials
      : [];
    const baseMaterialTotal = materials.reduce(
      (total, material) => total + Number(material.amount || 0),
      0
    );
    const approvedVariationTotal = variations
      .filter((variation) => variation.status === "APPROVED")
      .reduce((total, variation) => total + Number(variation.requestedAmount || 0), 0);
    const materialTotal = baseMaterialTotal + approvedVariationTotal;

    const extraChargesTotal = Array.isArray(quotation?.extraCharges)
      ? quotation!.extraCharges.reduce((sum: number, item: any) => sum + Number(item?.amount || 0), 0)
      : 0;

    const baseGrandTotal = Number(quotation?.grandTotal || quotation?.cost || project?.budget || 0);

    // Compute grand total from detailed components when possible so the
    // inspection view matches the contractor/client breakdowns.
    const computedGrandTotal =
      Number(quotation?.labourCost || 0) +
      Number(quotation?.electricalCost || 0) +
      Number(quotation?.plumbingCost || 0) +
      Number(quotation?.paintingCost || 0) +
      Number(quotation?.falseCeilingCost || 0) +
      materialTotal +
      extraChargesTotal;

    const effectiveGrandTotal = computedGrandTotal || baseGrandTotal;
    const materialRows: Material[] = [
      ...materials,
      ...variations
        .filter((variation) => variation.status === "APPROVED")
        .map((variation) => ({
          id: variation._id,
          name: variation.title,
          amount: Number(variation.requestedAmount || 0),
        })),
    ];
    const hasDetailedBreakdown = [
      quotation?.labourCost,
      quotation?.electricalCost,
      quotation?.plumbingCost,
      quotation?.paintingCost,
      quotation?.falseCeilingCost,
      baseMaterialTotal,
    ].some((value) => Number(value || 0) > 0);
    const costRows: [string, number][] = hasDetailedBreakdown
      ? [
          ["Labour Cost", Number(quotation?.labourCost || 0)],
          ["Electrical Cost", Number(quotation?.electricalCost || 0)],
          ["Plumbing Cost", Number(quotation?.plumbingCost || 0)],
          ["Painting Cost", Number(quotation?.paintingCost || 0)],
          ["False Ceiling", Number(quotation?.falseCeilingCost || 0)],
        ]
      : [["Contract Quotation", baseGrandTotal]];

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

    const paymentTarget = effectiveGrandTotal || Number(project?.budget || 0);
    const paymentDue = Math.max(paymentTarget - totalPaid, 0);
    const paymentStatus = paymentDue === 0 ? "Paid" : "Pending";
    const paymentTerms = project?.paymentTerms || quotation?.paymentTerms || "30-40-30 milestone structure";

    // Only what the client themselves uploaded. `project.files` also holds the
    // inspector's DESIGN and BOQ uploads, which belong in their own cards.
    const clientUploads = (project?.files || []).filter(
      (file: any) => file.uploadedBy === "CLIENT"
    );

    const approvedDesign =
  project?.approvedDesign ||
  project?.designFiles?.find(
    (d: any) => String(d._id) === String(project?.approvedDesignId)
  );

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        try {

            const data = await projectApi.getById(projectId as string);

setProject(data);

console.log("Approved Design ID:", data.approvedDesignId);
console.log("Approved Design:", data.approvedDesign);
console.log("Design Files:", data.designFiles);

console.log("PROJECT DATA");
console.log(data);
console.log("CONTRACTOR");
console.log(data.contractor);


// Load variations separately so a 403 doesn't stop the page
try {
  const variationsResponse: any = await variationApi.list(data._id || data.id);

  setVariations(
    Array.isArray(variationsResponse?.variations)
      ? variationsResponse.variations
      : []
  );
} catch (err) {
  console.log("Variation API failed:", err);
  setVariations([]);
}
            const attendanceResponse: any = await apiRequest(
  `/attendance/${data._id || data.id}/today`
);

setTodayAttendance(attendanceResponse.attendance);

console.log("Attendance Response:");
console.log(attendanceResponse);

const quotations = Array.isArray(data.quotations) ? data.quotations : [];
quotations.forEach((q: any) => {
    console.log("Quotation ID:", q._id);
});

const selectedQuote =
  data.selectedQuotationDetails ||
  quotations.find(
    (q: any) => String(q._id) === String(data.selectedQuotation)
  ) || quotations[0] || data.myQuotation || null;

console.log("SELECTED QUOTE:");
console.log(selectedQuote);


            setQuotation(selectedQuote);
            setQuotation(selectedQuote);

setTimeout(() => {
  console.log("========== QUOTATION STATE ==========");
  console.log(JSON.stringify(selectedQuote, null, 2));
}, 1000);
            console.log("SELECTED QUOTATION");
console.log(JSON.stringify(selectedQuote, null, 2));
            console.log("Labour:", selectedQuote?.labourCost);
console.log("Electrical:", selectedQuote?.electricalCost);
console.log("Plumbing:", selectedQuote?.plumbingCost);
console.log("Painting:", selectedQuote?.paintingCost);
console.log("False Ceiling:", selectedQuote?.falseCeilingCost);
console.log("Grand Total:", selectedQuote?.grandTotal);
console.log("EXTRA CHARGES", selectedQuote?.extraCharges);
console.log("MATERIALS", selectedQuote?.materials);
console.log("PDF", selectedQuote?.quotationPdf);
console.log("EXCEL", selectedQuote?.quotationExcel);
            console.log("MATERIALS");
console.log(selectedQuote?.materials);

console.log(
  "Quotation IDs:",
  quotations.map((q: any) => q._id)
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


await loadData();

alert("Contractor selected successfully.");

  } catch (err) {

    console.log(err);

    alert("Failed");

  }

};

    const processVariation = async (variationId: string, approve: boolean) => {
      try {
        setProcessingVariationId(variationId);
        if (approve) {
          await variationApi.approveByInspector(variationId);
        } else {
          await variationApi.rejectByInspector(variationId);
        }
        await loadData();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Unable to process variation request.");
      } finally {
        setProcessingVariationId(null);
      }
    };

    if (loading) {

        return <div className="p-10">Loading...</div>;

    }

   return (
  <div className="min-h-screen bg-slate-100">

  <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8">

    <section className="hidden rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[#70153A]">Material Variation Requests</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#70153A]">
          {variations.filter((variation) => variation.status === "PENDING_INSPECTOR").length} pending
        </span>
      </div>
      <div className="mt-4 h-[390px] overflow-y-auto space-y-3 pr-2">
        {variations.length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-slate-600">No material requests have been submitted by the contractor.</p>
        ) : (
          variations.map((variation) => {
            const isPending = variation.status === "PENDING_INSPECTOR";
            const statusStyle = variation.status === "APPROVED"
              ? "bg-green-100 text-green-700"
              : variation.status === "REJECTED"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-800";

            return (
              <div key={variation._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold">{variation.title} — ₹{Number(variation.requestedAmount || 0).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-600">{variation.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>{variation.status.replaceAll("_", " ")}</span>
                  {isPending && (
                    <>
                      <button disabled={processingVariationId === variation._id} onClick={() => processVariation(variation._id, false)} className="rounded-lg border border-red-200 px-4 py-2 text-red-700 disabled:opacity-50">Reject</button>
                      <button disabled={processingVariationId === variation._id} onClick={() => processVariation(variation._id, true)} className="rounded-lg bg-[#70153A] px-4 py-2 text-white disabled:opacity-50">Approve</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>

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
            Project Details
          </h1>

          <p className="text-slate-500 mt-1">
            Complete overview of your project, construction progress, documents and inspection details.
          </p>

        </div>

      </div>

      <div className="flex gap-3">
      </div>

    </div>

    <div className="grid grid-cols-12 gap-6">

    {/* Project Details */}

  <div className="col-span-4 bg-white rounded-3xl shadow-sm border p-8">

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

    <div className="grid grid-cols-2 gap-5 mt-8">

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

  <div className="col-span-5 bg-white rounded-3xl shadow-sm border p-8">

    <h2 className="text-xl font-bold text-[#70153A]">
  Project Summary
</h2>

<div className="grid grid-cols-2 gap-x-10 gap-y-8 mt-8">

  {/* Company */}
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-400">
      Company
    </p>
    <p className="mt-1 text-lg font-semibold text-slate-900">
      {project?.contractor?.companyName || "--"}
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
<div className="col-span-3 space-y-6">

  <div className="col-span-3 bg-white rounded-3xl shadow-sm border p-6">

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
  <div className="grid grid-cols-12 gap-6">

    {/* Cost Breakdown */}

    <div
  id="cost-breakdown"
  className="hidden col-span-5 box-border h-[576px] overflow-hidden rounded-3xl border bg-white p-8 shadow-sm"
>

      <div className="relative h-full overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {!isMaterialsView ? (
            <motion.div
              key="cost-breakdown"
              initial={{ x: -32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -32, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <h2 className="mb-6 text-2xl font-bold text-[#70153A]">Cost Breakdown</h2>
              <div className="overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-2 bg-slate-100 px-5 py-3 font-semibold">
                  <span>Item</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                {costRows.map(([label, value]) => (
                  <CostBreakdownRow key={label} label={label} value={value} />
                ))}
                <CostBreakdownRow
                  label="Materials"
                  value={materialTotal}
                  icon={<Package className="h-4 w-4" />}
                  onClick={() => setIsMaterialsView(true)}
                />
                <CostBreakdownTotal label="Grand Total" value={effectiveGrandTotal} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="materials"
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 32, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex min-h-0 flex-col"
            >
              <button
                type="button"
                onClick={() => setIsMaterialsView(false)}
                className="mb-3 flex w-fit items-center gap-2 font-semibold text-[#70153A]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h2 className="mb-4 text-2xl font-bold text-[#70153A]">Materials</h2>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-2 bg-slate-100 px-5 py-3 font-semibold">
                  <span>Material Name</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {materialRows.map((material, index) => (
                    <CostBreakdownRow
                      key={material.id ?? material._id ?? `${material.name}-${index}`}
                      label={material.name || "Unnamed Material"}
                      value={Number(material.amount || 0)}
                    />
                  ))}
                </div>
                <CostBreakdownTotal label="Material Total" value={materialTotal} />
                <CostBreakdownTotal label="Grand Total" value={effectiveGrandTotal} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*

      <h2 className="text-2xl font-bold text-[#70153A] mb-6">
        Cost Breakdown
      </h2>

    <div className="rounded-2xl border overflow-hidden">

  Header

  <div className="grid grid-cols-2 bg-slate-100 px-5 py-3 font-semibold">

    <span>Item</span>

    <span className="text-right">Amount (₹)</span>

  </div>

  {[
    ["Labour Cost", quotation?.labourCost],
    ["Electrical Cost", quotation?.electricalCost],
    ["Plumbing Cost", quotation?.plumbingCost],
    ["Painting Cost", quotation?.paintingCost],
    ["False Ceiling", quotation?.falseCeilingCost],
    ["Material Cost", quotation?.cost],
  ].map(([title, value]) => (

    <div
      key={title}
      className="grid grid-cols-2 px-5 py-4 border-t hover:bg-slate-50 transition"
    >

      <span>{title}</span>

      <span className="text-right font-semibold text-green-600">

        ₹{Number(value || 0).toLocaleString()}

      </span>

    </div>

  ))}

  <div className="grid grid-cols-2 bg-[#70153A]/5 px-5 py-5 border-t">

    <span className="text-lg font-bold">

      Grand Total

    </span>

    <span className="text-right text-2xl font-bold text-[#70153A]">

      ₹{effectiveGrandTotal.toLocaleString()}

    </span>

  </div>

</div>

      */}

    </div>

    {/* Additional Charges */}

    <div className="hidden col-span-3 bg-white rounded-3xl border shadow-sm p-8">

      <h2 className="text-xl font-bold text-[#70153A] mb-6">

        Additional Charges

      </h2>

      {quotation?.extraCharges?.length ? (

        quotation.extraCharges.map((item: any, index: number) => (

          <div
            key={index}
            className="flex justify-between mb-4"
          >
            <span>{item.name}</span>

            <span>

              ₹{item.amount?.toLocaleString()}

            </span>

          </div>

        ))

      ) : (

        <p className="text-slate-400">

          No Additional Charges

        </p>

      )}

    </div>

    {/* Attachments */}
    <div className="col-span-3 space-y-6">
<div className="bg-white rounded-3xl border shadow-sm p-8">
      <h2 className="text-xl font-bold text-[#70153A] mb-6">

        Quotation Attachments

      </h2>

      
       <div className="space-y-3">

  {quotation?.quotationExcel || quotation?.quotationPdf ? (

    <>

    {quotation?.quotationExcel && (

    <div className="flex items-center justify-between rounded-xl border p-4">

      <span className="font-semibold">
        Quotation Excel
      </span>

      <a
        href={quotation.quotationExcel}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#70153A] font-semibold hover:underline"
      >
        View
      </a>

    </div>

    )}

    {quotation?.quotationPdf && (

    <div className="flex items-center justify-between rounded-xl border p-4">

      <span className="font-semibold">
        Quotation PDF
      </span>

      <a
        href={quotation.quotationPdf}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#70153A] font-semibold hover:underline"
      >
        View
      </a>

    </div>

    )}

    </>

  ) : (

    <p className="text-slate-400">
      No quotation attachment uploaded
    </p>

  )}

</div>

    </div>

<div className="bg-white rounded-3xl border shadow-sm p-8">
  <h2 className="mb-1 text-xl font-bold text-[#70153A]">Client Details</h2>
  <p className="mb-5 text-xs text-slate-500">Contact information for the project owner.</p>

  <div className="divide-y divide-slate-100">
    <div className="flex items-center gap-3 py-3 first:pt-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#70153A]/10 text-[#70153A]">
        <User size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</p>
        <p className="truncate font-semibold text-slate-900">
          {project?.clientId?.name || "--"}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#70153A]/10 text-[#70153A]">
        <Phone size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone</p>
        {project?.clientId?.phone ? (
          <a
            href={`tel:${project.clientId.phone}`}
            className="block truncate font-semibold text-[#70153A] hover:underline"
          >
            {project.clientId.phone}
          </a>
        ) : (
          <p className="font-semibold text-slate-900">--</p>
        )}
      </div>
    </div>

    <div className="flex items-center gap-3 py-3 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#70153A]/10 text-[#70153A]">
        <Mail size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</p>
        {project?.clientId?.userId?.email ? (
          <a
            href={`mailto:${project.clientId.userId.email}`}
            title={project.clientId.userId.email}
            className="block truncate font-semibold text-[#70153A] hover:underline"
          >
            {project.clientId.userId.email}
          </a>
        ) : (
          <p className="font-semibold text-slate-900">--</p>
        )}
      </div>
    </div>
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
              />

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
            ? "Contractor has checked in today."
            : "Contractor has not checked in today."}
        </p>
      </div>

      <button
        onClick={() => router.push(`/inspection/project/${project._id}/attendance`)}
        className="w-full rounded-xl bg-[#70153A] py-3 font-semibold text-white transition hover:bg-[#5d1031]"
      >
        View Attendance History
      </button>

    </div>

  </div>

</div>
</div>
    <div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">

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
<div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">

  <h2 className="text-xl font-bold text-[#70153A] mb-6">
    Client Uploads
  </h2>

  <div className="mt-6">

    {clientUploads.length ? (

      <div className="grid grid-cols-2 gap-4">

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
<div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">

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
      href={approvedDesign?.fileUrl || approvedDesign?.url}
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

  <div className="hidden col-span-3 bg-white rounded-3xl border shadow-sm p-8">

    <h2 className="text-xl font-bold text-[#70153A] mb-6">
      Payment
    </h2>

    <div className="space-y-4 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">Total Target</span>
        <span className="font-semibold">₹{paymentTarget?.toLocaleString() || "0"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Total Paid</span>
        <span className="font-semibold text-green-600">₹{totalPaid?.toLocaleString() || "0"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">Amount Due</span>
        <span className="font-semibold text-red-600">₹{paymentDue?.toLocaleString() || "0"}</span>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FEF3C7] p-4">
        <p className="text-sm font-semibold text-[#92400E]">Status: {paymentStatus}</p>
        <p className="mt-2 text-xs text-slate-500">{paymentTerms}</p>
      </div>
    </div>

  </div>

<div className="col-span-12">
  <div className="grid grid-cols-12 gap-6 mt-6">
    <div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">
      
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

    <div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">
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

    <div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">
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

    <div className="col-span-3 bg-white rounded-3xl border shadow-sm p-8">
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

</div>
);
}
