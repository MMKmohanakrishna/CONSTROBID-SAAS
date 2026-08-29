"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  Building2,
  Briefcase,
  MapPin,
  CheckCircle,
  Image,
  User,
  Ruler,
  IndianRupee,
  AlertTriangle,
  Box,
  House,
  Palette,
  Plus,
  Trash2,
  Wrench,
  X,
  Zap,
  ClipboardCheck,
  FileText,
  FileSpreadsheet,
  Paperclip,
} from "lucide-react";
import BiddingCountdown from "@/components/common/BiddingCountdown";
import { apiRequest, projectApi } from "@/lib/api";
import { useLightbox } from "@/context/LightboxContext";
import ContractorSidebar from "@/components/contractor/ContractorSidebar";
const logoPng = new URL('../../../../../assets/Logo-B&W.png', import.meta.url);

interface BrowseQuotationPageProps {
  router: any;
  project: any;
  loading: boolean;
  companyName: string;
  companyEmail: string;
  activeNav: string;
  logout: () => void;
}

export default function BrowseQuotationPage({
  router,
  project,
  loading,
  companyName,
  companyEmail,
  activeNav,
  logout,
}: BrowseQuotationPageProps) {
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const { openFile } = useLightbox();
  const [materialName, setMaterialName] = useState("");
  const [materialAmount, setMaterialAmount] = useState("");
  const [materials, setMaterials] = useState<any[]>(
    project?.materials || project?.myQuotation?.materials || []
  );
  const [resourceTab, setResourceTab] = useState<"design" | "uploads" | "inspection">("design");
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeName, setChargeName] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [extraCharges, setExtraCharges] = useState<any[]>([]);
  const [quotationExcel, setQuotationExcel] = useState("");
  const [quotationPdf, setQuotationPdf] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState<"excel" | "pdf" | null>(null);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [quotationSubmitted, setQuotationSubmitted] = useState(false);
  const [costValues, setCostValues] = useState({
    labourCost: Number(project?.labourCost ?? 0),
    electricalCost: Number(project?.electricalCost ?? 0),
    plumbingCost: Number(project?.plumbingCost ?? 0),
    falseCeilingCost: Number(project?.falseCeilingCost ?? 0),
    paintingCost: Number(project?.paintingCost ?? 0),
  });
  const [draftLoaded, setDraftLoaded] = useState(false);
  const deadlinePassed = project?.quotationDeadline
    ? new Date(project.quotationDeadline).getTime() <= Date.now()
    : false;
  const quotationClosed =
    deadlinePassed ||
    [
      "CLIENT_COMPARISON",
      "CONTRACTOR_SELECTED",
      "CONTRACTOR_CONFIRMED",
      "WORK_STARTED",
      "IN_PROGRESS",
      "COMPLETION_VERIFICATION",
      "READY_FOR_HANDOVER",
      "PROJECT_COMPLETED",
    ].includes(project?.status);
  // The inspector sent the quotation back asking for revised figures, so the
  // existing quotation must not lock the form — until it is re-submitted here.
  const requoteRequested =
    project?.requoteRequested === true ||
    project?.myQuotation?.requoteRequested === true;

  const hasSubmittedQuotation =
    quotationSubmitted ||
    (!requoteRequested &&
      (project?.hasSubmittedQuotation === true || project?.myQuotation != null));

  useEffect(() => {
    const projectId = project?._id || project?.id;
    if (!projectId) return;

    let cancelled = false;
    projectApi.getDraft(String(projectId))
      .then((draft: any) => {
        if (cancelled || !draft || Object.keys(draft).length === 0) return;

        setCostValues({
          labourCost: Number(draft.labourCost ?? 0),
          electricalCost: Number(draft.electricalCost ?? 0),
          plumbingCost: Number(draft.plumbingCost ?? 0),
          falseCeilingCost: Number(draft.falseCeilingCost ?? 0),
          paintingCost: Number(draft.paintingCost ?? 0),
        });
        if (Array.isArray(draft.materials)) setMaterials(draft.materials);
        if (Array.isArray(draft.extraCharges)) setExtraCharges(draft.extraCharges);
        setQuotationExcel(draft.quotationExcel || "");
        setQuotationPdf(draft.quotationPdf || "");
      })
      .catch((error) => console.error("Failed to load quotation draft", error))
      .finally(() => {
        if (!cancelled) setDraftLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [project?._id, project?.id]);

  useEffect(() => {
    if (!draftLoaded || quotationClosed || hasSubmittedQuotation) return;

    const projectId = project?._id || project?.id;
    if (!projectId) return;

    const timer = window.setTimeout(() => {
      projectApi.saveDraft(String(projectId), {
        ...costValues,
        materials,
        extraCharges,
        quotationExcel,
        quotationPdf,
        grandTotal: costValues.labourCost +
          costValues.electricalCost +
          costValues.plumbingCost +
          costValues.falseCeilingCost +
          costValues.paintingCost +
          materials.reduce((total, item) => total + Number(item.amount || 0), 0) +
          extraCharges.reduce((total, item) => total + Number(item.amount || 0), 0) +
          Number(project?.gst ?? 0),
      }).catch((error) => console.error("Failed to save quotation draft", error));
    }, 500);

    return () => window.clearTimeout(timer);
  }, [draftLoaded, project?._id, project?.id, costValues, materials, extraCharges, quotationExcel, quotationPdf, hasSubmittedQuotation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        Loading...
      </div>
    );
  }

  const projectTitle = project?.title || project?.client?.name || "Project";
  const statusLabel = quotationClosed ? "BIDDING CLOSED" : "OPEN FOR BIDDING";
  const projectCategory = project?.category || "Interior Design";
  const projectType = project?.projectType || "Apartment";
  const projectLocation = project?.location || project?.city || "Bangalore";
  const budget = Number(project?.budget || 0);
  const area = project?.area || "150";
  const clientName = project?.client?.name || "Amit Khan";
  const inspectionStatus = project?.inspectionStatus || "Completed";
  const designStatus = project?.designStatus || "Available";
  const designFiles = [
    ...(Array.isArray(project?.designFiles) ? project.designFiles : []),
    ...(Array.isArray(project?.files)
      ? project.files.filter((file: any) => file.meta?.category === "DESIGN")
      : []),
  ];
  const boqFiles = [
    ...(Array.isArray(project?.boqFiles) ? project.boqFiles : []),
    ...(Array.isArray(project?.files)
      ? project.files.filter((file: any) => file.meta?.category === "BOQ")
      : []),
  ]
    .filter(
      (file: any, index: number, all: any[]) =>
        all.findIndex((other: any) => String(other._id) === String(file._id)) === index
    )
    .filter((file: any) => {
      const name = String(file?.meta?.originalName || file?.fileName || file?.fileUrl || "")
        .split("?")[0]
        .toLowerCase();
      return name.endsWith(".xls") || name.endsWith(".xlsx");
    })
    .sort(
      (a: any, b: any) =>
        new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
    );

  const approvedDesign = designFiles.find(
    (file: any) =>
      String(file._id || file.id) === String(project?.approvedDesignId)
  ) || designFiles[0] || project?.approvedDesign;
  const designUrl =
    approvedDesign?.fileUrl ||
    approvedDesign?.url ||
    (typeof approvedDesign === "string" ? approvedDesign : "");
  const hasApprovedDesign = Boolean(designUrl);
  const inspectionReport = project?.inspectionReport;
  const inspectionPhotos = inspectionReport?.photos || project?.inspectionPhotos || [];
  const inspectionPdf =
    inspectionReport?.documents?.[0] || project?.inspectionReportPdf || "";
  const resourceTabs = [
    { id: "design" as const, label: "Design", icon: Image },
    { id: "uploads" as const, label: "Uploads", icon: FileText },
    { id: "inspection" as const, label: "Inspection", icon: ClipboardCheck },
  ];

  const handleViewDesign = () => {
    openFile(designUrl);
  };
  const costRows = [
    { label: "Labour Cost", key: "labourCost", value: costValues.labourCost, icon: User, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Electrical Cost", key: "electricalCost", value: costValues.electricalCost, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Plumbing Cost", key: "plumbingCost", value: costValues.plumbingCost, icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "False Ceiling", key: "falseCeilingCost", value: costValues.falseCeilingCost, icon: House, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Painting", key: "paintingCost", value: costValues.paintingCost, icon: Palette, color: "text-pink-500", bg: "bg-pink-50" },
  ];
  const materialTotal = materials.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );
  const gst = Number(project?.gst ?? 0);
  const additionalChargesTotal = extraCharges.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );
  const grandTotal = costRows.reduce((total, row) => total + Number(row.value || 0), 0) + materialTotal + additionalChargesTotal + gst;

  const addMaterial = () => {
    const name = materialName.trim();
    const amount = Number(materialAmount);
    if (!name || !Number.isFinite(amount) || amount < 0) return;

    setMaterials((current) => [...current, { id: Date.now(), name, amount }]);
    setMaterialName("");
    setMaterialAmount("");
    setShowAddMaterial(false);
  };

  const addCharge = () => {
    const name = chargeName.trim();
    const amount = Number(chargeAmount);
    if (!name || !Number.isFinite(amount) || amount < 0) return;

    setExtraCharges((current) => [...current, { id: Date.now(), name, amount }]);
    setChargeName("");
    setChargeAmount("");
    setShowChargeModal(false);
  };

  const uploadQuotationAttachment = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "excel" | "pdf"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(type);
    try {
      const form = new FormData();
      form.append("images", file);
      const response: any = await apiRequest("/uploads", {
        method: "POST",
        body: form,
      });
      const url = response?.[0]?.url;
      if (!url) throw new Error("Attachment upload failed");
      if (type === "excel") setQuotationExcel(url);
      else setQuotationPdf(url);
    } catch (error) {
      console.error("Failed to upload quotation attachment", error);
    } finally {
      setUploadingAttachment(null);
      event.target.value = "";
    }
  };

  const submitQuotation = async () => {
    const projectId = project?._id || project?.id;
    if (!projectId || quotationClosed || submittingQuotation) return;

    // The quotation sheet is what the inspection team reviews, so a bid
    // without one cannot be submitted.
    if (!quotationExcel) {
      setAttachmentError("Upload your quotation Excel before submitting.");
      return;
    }

    setAttachmentError("");
    setSubmittingQuotation(true);
    try {
      await projectApi.submitQuotation(String(projectId), {
        labourCost: costValues.labourCost,
        electricalCost: costValues.electricalCost,
        plumbingCost: costValues.plumbingCost,
        falseCeilingCost: costValues.falseCeilingCost,
        paintingCost: costValues.paintingCost,
        materials,
        extraCharges,
        quotationExcel,
        quotationPdf,
        grandTotal,
      });
      setQuotationSubmitted(true);
      router.push("/contractor/dashboard?tab=browse");
    } catch (error) {
      console.error("Failed to submit quotation", error);
    } finally {
      setSubmittingQuotation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      <ContractorSidebar active={activeNav || "browse"} />

      <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 text-brand-dark">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={22} className="text-slate-700" />
              </button>
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Back to Projects</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
              <span className="text-gray-500">Verification Status:</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">VERIFIED</span>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-center">
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-center">
                  <div className="h-28 w-28 rounded-[2rem] bg-slate-950/5 overflow-hidden shadow-sm">
                    {project?.image ? (
                      <img
                        src={project.image}
                        alt={projectTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100">
                        <Image size={42} className="text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase text-rose-700">{projectCategory}</span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase text-sky-700">{projectType}</span>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900">{projectTitle}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={16} />
                      <span>{projectLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-end">
                <span className={`rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.15em] shadow-sm ${
                  quotationClosed
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                <div className="flex items-center gap-3 text-rose-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><User size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Client</span>
                </div>
                <div className="mt-3 font-bold text-slate-900">{clientName}</div>
              </div>

              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                <div className="flex items-center gap-3 text-sky-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><Ruler size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Area</span>
                </div>
                <div className="mt-3 font-bold text-slate-900">{area} sq.ft</div>
              </div>

              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                <div className="flex items-center gap-3 text-amber-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><IndianRupee size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Budget</span>
                </div>
                <div className="mt-3 font-bold text-slate-900">₹{budget.toLocaleString()}</div>
              </div>

              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center gap-3 text-emerald-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><CheckCircle size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Inspection</span>
                </div>
                <div className="mt-3 font-bold text-emerald-700">{inspectionStatus}</div>
              </div>

              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
                <div className="flex items-center gap-3 text-violet-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><Image size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Design</span>
                </div>
                <div className="mt-3 font-bold text-violet-700">{designStatus}</div>
              </div>

              <div className="rounded-3xl p-5 text-sm shadow-sm transform transition-transform duration-200 hover:scale-105 bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
                <div className="flex items-center gap-3 text-rose-700">
                  <span className="p-2 rounded-full bg-white/60 shadow-sm"><AlertTriangle size={16} /></span>
                  <span className="uppercase tracking-[0.2em]">Status</span>
                </div>
                <div className="mt-3 font-bold text-rose-700">{statusLabel}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
            <section className="space-y-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              {project?.quotationDeadline ? (
                <BiddingCountdown deadline={project.quotationDeadline} />
              ) : (
                <div className={`rounded-[1.75rem] border p-5 ${quotationClosed ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  <div className="font-bold">{quotationClosed ? 'Quotation Closed' : 'Open for Bidding'}</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {quotationClosed
                      ? 'Quotation submissions are no longer available for this project.'
                      : 'You can submit a quotation for this project.'}
                  </div>
                </div>
              )}

              {/* Cost breakdown, materials and additional charges are hidden;
                  only the submit action remains on this screen. */}
              {(!quotationClosed || hasSubmittedQuotation) && (
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                  {requoteRequested && !hasSubmittedQuotation && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                      <div className="font-bold">Re Quote Requested</div>
                      <p className="mt-1 text-sm">
                        {project?.myQuotation?.inspectorRemarks
                          ? project.myQuotation.inspectorRemarks
                          : "The inspector asked you to submit a revised quotation."}
                      </p>
                    </div>
                  )}

                  {!hasSubmittedQuotation && !quotationExcel && (
                    <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                      Upload your quotation Excel below before you can submit.
                    </p>
                  )}

                  {attachmentError && (
                    <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                      {attachmentError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submitQuotation}
                    disabled={submittingQuotation || hasSubmittedQuotation || !quotationExcel}
                    title={quotationExcel ? "" : "Upload your quotation Excel first"}
                    className="w-full rounded-xl bg-[#70153A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#5B0D28] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingQuotation
                      ? "Submitting..."
                      : hasSubmittedQuotation
                        ? "Quotation Submitted"
                        : requoteRequested
                          ? "Submit Re Quote"
                          : "Submit Quotation"}
                  </button>
                </div>
              )}

              {showChargeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <button type="button" aria-label="Close charge dialog" className="absolute inset-0 bg-white/25 backdrop-blur-md" onClick={() => setShowChargeModal(false)} />
                  <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(36,10,25,0.28)]">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#70153A]">Add Additional Charge</h3>
                      <button type="button" onClick={() => setShowChargeModal(false)} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-600">Charge Name
                        <input autoFocus value={chargeName} onChange={(event) => setChargeName(event.target.value)} placeholder="e.g. Transportation" className="mt-2 w-full rounded-xl border border-[#D49AAF] px-4 py-3 outline-none focus:border-[#70153A] focus:ring-2 focus:ring-[#70153A]/10" />
                      </label>
                      <label className="block text-sm font-medium text-slate-600">Amount (₹)
                        <input type="number" min="0" value={chargeAmount} onChange={(event) => setChargeAmount(event.target.value)} placeholder="5000" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#70153A] focus:ring-2 focus:ring-[#70153A]/10" />
                      </label>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowChargeModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600">Cancel</button>
                        <button type="button" onClick={addCharge} className="rounded-xl bg-[#70153A] px-4 py-2 font-semibold text-white">Add Charge</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showAddMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <button type="button" aria-label="Close add material dialog" className="absolute inset-0 bg-white/5 backdrop-blur-md" onClick={() => setShowAddMaterial(false)} />
                  <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(36,10,25,0.28)]">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#70153A]">Add Material</h3>
                      <button type="button" onClick={() => setShowAddMaterial(false)} aria-label="Close dialog" className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-600">Material Name
                        <input value={materialName} onChange={(event) => setMaterialName(event.target.value)} placeholder="e.g. Cement (10 bags)" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#70153A]" />
                      </label>
                      <label className="block text-sm font-medium text-slate-600">Amount (₹)
                        <input type="number" min="0" value={materialAmount} onChange={(event) => setMaterialAmount(event.target.value)} placeholder="5000" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#70153A]" />
                      </label>
                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowAddMaterial(false)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600">Cancel</button>
                        <button type="button" onClick={addMaterial} className="rounded-xl bg-[#70153A] px-4 py-2 font-semibold text-white">Add Material</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
                <h3 className="mb-5 text-xl font-bold text-[#70153A]">Project Resources</h3>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
                  {resourceTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setResourceTab(tab.id)}
                        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${resourceTab === tab.id ? "bg-[#70153A] text-white shadow-sm" : "text-slate-500 hover:text-[#70153A]"}`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 min-h-24 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {resourceTab === "design" && (
                    inspectionPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {inspectionPhotos.map((photo: any, index: number) => {
                          const photoUrl = typeof photo === "string" ? photo : photo?.fileUrl || photo?.url;
                          return photoUrl ? (
                            <a key={`${photoUrl}-${index}`} href={photoUrl} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <img src={photoUrl} alt={`Inspector upload ${index + 1}`} className="h-full w-full object-cover transition hover:scale-105" />
                            </a>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No inspector images available.</p>
                    )
                  )}

                  {resourceTab === "uploads" && (
                    inspectionPdf ? (
                      <a href={inspectionPdf} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-[#70153A] hover:bg-rose-50">
                        <span>Inspector Inspection Report.pdf</span>
                        <span className="text-xs text-slate-400">Open PDF</span>
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">No inspector PDF available.</p>
                    )
                  )}

                  {resourceTab === "inspection" && (
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="font-semibold text-emerald-700">{inspectionStatus}</p>
                      {inspectionReport?.notes || project?.inspectionNotes ? (
                        <p>{inspectionReport?.notes || project.inspectionNotes}</p>
                      ) : null}
                      <p>{inspectionPhotos.length} inspection photo{inspectionPhotos.length === 1 ? "" : "s"} available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
                <h3 className="text-lg font-bold text-[#70153A]">Design</h3>
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Design Version 1</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {hasApprovedDesign
                          ? approvedDesign?.meta?.originalName ||
                            approvedDesign?.fileName ||
                            "Design shared by the inspector"
                          : "No design shared yet"}
                      </div>
                    </div>
                      <button
                        type="button"
                        onClick={handleViewDesign}
                        disabled={!hasApprovedDesign}
                        className="rounded-2xl bg-[#70153A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5B0D28] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                      View Design
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
                <h3 className="text-lg font-bold text-[#70153A]">Bill of Quantity</h3>

                {boqFiles.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No BOQ shared by the inspector yet.
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          BOQ Version {boqFiles.length}
                        </div>

                        <div className="mt-1 truncate text-sm text-slate-500">
                          {boqFiles[0].meta?.originalName ||
                            boqFiles[0].fileName ||
                            "Latest BOQ from the inspector"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openFile(boqFiles[0].fileUrl || boqFiles[0].url || "")
                        }
                        disabled={!(boqFiles[0].fileUrl || boqFiles[0].url)}
                        className="shrink-0 rounded-2xl bg-[#70153A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5B0D28] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        View BOQ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
                <div className="mb-3 flex items-center gap-2 font-semibold text-[#70153A]">
                  <Paperclip size={17} />
                  Quotation Attachments
                </div>
                {(!quotationClosed && !hasSubmittedQuotation) ? (
                  <div className="grid gap-3">
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-semibold text-slate-600 hover:border-[#70153A] hover:text-[#70153A] ${uploadingAttachment === "excel" ? "pointer-events-none opacity-50" : ""}`}>
                      <FileSpreadsheet size={17} />
                      {uploadingAttachment === "excel" ? "Uploading..." : quotationExcel ? "Replace Excel" : "Upload Excel"}
                      <input type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" disabled={quotationClosed || hasSubmittedQuotation || uploadingAttachment !== null} onChange={(event) => uploadQuotationAttachment(event, "excel")} />
                    </label>
                  </div>
                ) : !quotationExcel && (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-sm text-slate-400">
                    {quotationClosed ? "Bidding is closed — no attachment was submitted." : "No attachment uploaded."}
                  </p>
                )}
                {quotationExcel && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                    <a href={quotationExcel} target="_blank" rel="noreferrer" className="text-[#70153A] hover:underline">View Excel</a>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
