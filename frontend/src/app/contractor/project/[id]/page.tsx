'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  LayoutDashboard,
  Search,
  Building2,
  Wallet,
  Briefcase,
  CalendarDays,
  X,
  Download,
  MapPin,
  User,
  Ruler,
  IndianRupee,
  ClipboardCheck,
  Package,
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';
import {
  FileText,
  Home,
  Image,
  FileImage,
  ClipboardList,
  HardHat,
  Zap,
  Wrench,
  House,
  Palette,
  Camera,
  FileCheck,
  StickyNote,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { apiRequest, projectApi, variationApi } from '@/lib/api';
import { useRealtimeRefresh } from '@/components/RealtimeSyncProvider';
import { useAuth } from '@/context/AuthContext';
import { useLightbox } from '@/context/LightboxContext';
import BrowseQuotationPage from './BrowseQuotationPage';
const logoPng = new URL('../../../../../assets/Logo-B&W.png', import.meta.url);

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
        &#8377;{Number(value || 0).toLocaleString()}
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

function CostInputRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-center border-t px-5 py-3 text-left">
      <span>{label}</span>
      <div className="flex items-center justify-end gap-1">
        <span className="text-green-600 font-semibold">&#8377;</span>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          placeholder="0"
          className="w-32 rounded-lg border px-3 py-1.5 text-right font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
        />
      </div>
    </div>
  );
}

function CostBreakdownTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-2 border-t bg-[#70153A]/5 px-5 py-5">
      <span className="text-lg font-bold">{label}</span>
      <span className="text-right text-2xl font-bold text-[#70153A]">
        &#8377;{Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}

export default function ContractorProjectDetails() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { openFile } = useLightbox();

  const {
    user,
    logout,
    token
  } = useAuth();

  const [showChargeModal, setShowChargeModal] = useState(false);
  const [quotationSubmitted, setQuotationSubmitted] = useState(false);
  const [quotationExcelFile, setQuotationExcelFile] = useState<File | null>(null);
  const [quotationExcelUrl, setQuotationExcelUrl] = useState<string | null>(null);
  const [quotationExcelName, setQuotationExcelName] = useState<string | null>(null);

  const [quotationPdfFile, setQuotationPdfFile] = useState<File | null>(null);
  const [quotationPdfUrl, setQuotationPdfUrl] = useState<string | null>(null);
  const [quotationPdfName, setQuotationPdfName] = useState<string | null>(null);

  const [uploadingQuotationFile, setUploadingQuotationFile] = useState(false);
  const [chargeName, setChargeName] = useState("");

  const [chargeAmount, setChargeAmount] = useState("");
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [materialName, setMaterialName] = useState("");

  const [materialPrice, setMaterialPrice] = useState("");

  const [variationReason, setVariationReason] = useState("");

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialAmount, setNewMaterialAmount] = useState("");

  const [materials, setMaterials] = useState<
    {
      id: number;
      name: string;
      amount: number;
    }[]
  >([]);

  const [variationRequests, setVariationRequests] = useState<any[]>([]);

  const [project, setProject] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'details' | 'design'>('details');
  const [activeTab, setActiveTab] = useState<'design' | 'uploads' | 'requirements' | 'inspection'>('design');
  const [activeNav, setActiveNav] = useState<'overview' | 'browse' | 'active'>('browse');
  const [designOpened, setDesignOpened] = useState(false);
  const [isMaterialsView, setIsMaterialsView] = useState(false);
  const [labourCost, setLabourCost] = useState(0);
  const [electricalCost, setElectricalCost] = useState(0);
  const [plumbingCost, setPlumbingCost] = useState(0);
  const [falseCeilingCost, setFalseCeilingCost] = useState(0);
  const [paintingCost, setPaintingCost] = useState(0);

  const applyQuotationValues = (quotation: any) => {

    console.log("Quotation Object");
    console.log(quotation);

    setLabourCost(Number(quotation?.labourCost ?? 0));
    setElectricalCost(Number(quotation?.electricalCost ?? 0));
    setPlumbingCost(Number(quotation?.plumbingCost ?? 0));
    setFalseCeilingCost(Number(quotation?.falseCeilingCost ?? 0));
    setPaintingCost(Number(quotation?.paintingCost ?? 0));
    setMaterials(Array.isArray(quotation?.materials) ? quotation.materials : []);
    setExtraCharges(Array.isArray(quotation?.extraCharges) ? quotation.extraCharges : []);
    if (quotation?.quotationExcel) {
      setQuotationExcelUrl(quotation.quotationExcel);
      setQuotationExcelName(
        quotation.quotationExcel.split("/").pop()?.split("?")[0] || "Quotation Excel"
      );
    }

    if (quotation?.quotationPdf) {
      setQuotationPdfUrl(quotation.quotationPdf);
      setQuotationPdfName(
        quotation.quotationPdf.split("/").pop()?.split("?")[0] || "Quotation PDF"
      );
    }
  };

  const uploadQuotationFile = async (file: File) => {
    setUploadingQuotationFile(true);
    try {
      const form = new FormData();
      form.append('images', file);
      const res: any = await apiRequest('/uploads', {
        method: 'POST',
        body: form,
      });
      const url = res?.[0]?.url;
      if (!url) {
        throw new Error('Quotation upload failed');
      }
      return url;
    } finally {
      setUploadingQuotationFile(false);
    }
  };

  const saveDraft = async (draftData?: {
    labourCost: number;
    electricalCost: number;
    plumbingCost: number;
    falseCeilingCost: number;
    paintingCost: number;
    materials: {
      id: number;
      name: string;
      amount: number;
    }[];
    extraCharges: {
      id: number;
      name: string;
      amount: number;
    }[];
    grandTotal: number;
    quotationExcel: string | null;
    quotationPdf: string | null;
  }) => {
    const payload = draftData ?? {
      labourCost,
      electricalCost,
      plumbingCost,
      falseCeilingCost,
      paintingCost,
      materials,
      extraCharges,
      grandTotal,
      quotationExcel: quotationExcelUrl,
      quotationPdf: quotationPdfUrl,
    };

    const projectId = project?._id || project?.id || id;
    console.log("saveDraft Started", {
      projectId,
      quotationSubmitted,
      hasSubmittedQuotation: project?.hasSubmittedQuotation,
      materialsCount: payload.materials.length,
      extraChargesCount: payload.extraCharges.length,
      grandTotal: payload.grandTotal,
    });
    if (!projectId) {
      console.log("saveDraft aborted: missing project id");
      return;
    }

    try {
      console.log("saveDraft calling API", {
        projectId,
        materialsCount: payload.materials.length,
        extraChargesCount: payload.extraCharges.length,
        grandTotal: payload.grandTotal,
      });
      await projectApi.saveDraft(projectId, payload);

      console.log("Draft Saved");
    } catch (err: any) {
      // Expected once bidding closes elsewhere (another tab, a deadline that
      // just passed) — not worth surfacing as an error.
      if (String(err?.message || '').includes('Quotation is closed')) {
        console.log('saveDraft skipped: quotation already closed');
      } else {
        console.error(err);
      }
    }
  };

  const loadDraft = async () => {
    if (!project?.id && !project?._id) return;

    try {
      const draft = await projectApi.getDraft(project._id || project.id);

      if (!draft || Object.keys(draft).length === 0) return;

      applyQuotationValues(draft);
      if (draft?.quotationExcel) {
        setQuotationExcelUrl(draft.quotationExcel);
        setQuotationExcelName(
          draft.quotationExcel.split("/").pop()?.split("?")[0] || "Quotation Excel"
        );
      } else if (draft?.quotationPdf) {
        setQuotationPdfUrl(draft.quotationPdf);
        setQuotationPdfName(
          draft.quotationPdf.split("/").pop()?.split("?")[0] || "Quotation PDF"
        );
      }

      console.log("Draft Loaded");
    } catch (err) {
      console.error(err);
    }
  };

  const [extraCharges, setExtraCharges] = useState<
    {
      id: number;
      name: string;
      amount: number;
    }[]
  >([]);

  useEffect(() => {

    if (!token) return;

    if (!id) return;

    fetchProject();

  }, [id, token]);

  useRealtimeRefresh(fetchProject);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'design') {
      setSelectedTab(tab);
    } else {
      setSelectedTab('details');
    }
  }, [searchParams]);

  useEffect(() => {
    const from = searchParams.get("from");
    const isBrowseProject = from === "browse";
const isWorkProject = from === "works";

    if (from === "works") {
      setActiveNav("active");
    } else if (from === "browse") {
      setActiveNav("browse");
    } else {
      setActiveNav("overview");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!project || designOpened) return;

    if (selectedTab === 'design' && project.designFiles?.length > 0) {
      openFile(project.designFiles[0].fileUrl);
      setDesignOpened(true);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', `/contractor/project/${id}`);
      }
    }
  }, [selectedTab, project, designOpened, id]);

  useEffect(() => {
    // Once bidding is closed (a contractor selected, deadline passed, or this
    // contractor already submitted) the backend rejects every draft save with
    // "Quotation is closed" — so stop trying instead of logging that on a loop.
    const deadlinePassedNow = project?.quotationDeadline
      ? new Date(project.quotationDeadline) < new Date()
      : false;
    const closedStatuses = [
      "CLIENT_COMPARISON",
      "CONTRACTOR_SELECTED",
      "CONTRACTOR_CONFIRMED",
      "WORK_STARTED",
      "IN_PROGRESS",
      "COMPLETION_VERIFICATION",
      "PROJECT_COMPLETED",
    ];
    const closedForDraft =
      quotationSubmitted || deadlinePassedNow || closedStatuses.includes(project?.status);

    if (!project || closedForDraft) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    project,
    quotationSubmitted,
    labourCost,
    electricalCost,
    plumbingCost,
    falseCeilingCost,
    paintingCost,
    materials,
    extraCharges,
  ]);


  async function fetchProject() {
    try {

      console.log("Fetching Project", id);
      const data = await projectApi.getById(id as string);

      console.log("PROJECT DATA");
      console.log(data);
      setProject(data);
      if (searchParams.get("from") === "browse") {
        setVariationRequests([]);
      } else {
        const variationsResponse: any = await variationApi.list(data._id || data.id);
        setVariationRequests(Array.isArray(variationsResponse?.variations) ? variationsResponse.variations : []);
      }
      const attendanceResponse: any = await apiRequest(
  `/attendance/${data._id || data.id}/today`
);

setTodayAttendance(attendanceResponse.attendance);
      if (data.hasSubmittedQuotation) {
    setQuotationSubmitted(true);

    applyQuotationValues(data.myQuotation);
} else {
    const draft = await projectApi.getDraft(data._id || data.id);

    if (draft && Object.keys(draft).length > 0) {
        applyQuotationValues(draft);
    }
}
      console.log("FULL PROJECT");
      console.log(data);

      console.log("Inspection Report");
      console.log(data.inspectionReport);

      console.log("Inspection Photos");
      console.log(data.inspectionReport?.photos);

      console.log("Inspection PDF");
      console.log(data.inspectionReport?.pdf);

      console.log("Inspection Notes");
      console.log(data.inspectionReport?.notes);

      console.log("PROJECT DATA");
      console.log(data);
      console.log("Approved Design ID:", data.approvedDesignId);

      console.log("Files:");
      console.log(data.files);


    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const fetchTodayAttendance = async () => {
  try {
    if (!project) return;

    const response: any = await apiRequest(
      `/attendance/${project._id || project.id}/today`
    );

    setTodayAttendance(response.attendance);
  } catch (error) {
    console.error(error);
  }
};

  function addCharge() {

    if (!chargeName.trim()) return;

    setExtraCharges(prev => [
      ...prev,
      {
        id: Date.now(),
        name: chargeName,
        amount: Number(chargeAmount || 0),
      },
    ]);

    setChargeName("");
    setChargeAmount("");
    setShowChargeModal(false);
  }

  function removeCharge(id: number) {

    setExtraCharges(prev =>
      prev.filter(item => item.id !== id)
    );

  }

  async function submitVariationRequest() {
    if (!project?._id && !project?.id) {
  alert("Project not found");
  return;
}

    const amount = Number(materialPrice);
    if (!materialName.trim() || !variationReason.trim() || !Number.isFinite(amount) || amount <= 0) {
      alert("Enter a title, reason, and a valid amount.");
      return;
    }

    try {
      const response: any = await variationApi.create(project._id || project.id, {
        title: materialName.trim(),
        reason: variationReason.trim(),
        items: [{ description: materialName.trim(), quantity: 1, unit: "item", unitPrice: amount, total: amount }],
      });
      setVariationRequests((current) => [response.variation, ...current]);
      setMaterialName("");
      setMaterialPrice("");
      setVariationReason("");
      setShowMaterialModal(false);
      alert("Variation request sent to the inspector for approval.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to submit variation request.");
    }
  }

  function removeMaterial(id: number) {

    setMaterials(prev =>
      prev.filter(item => item.id !== id)
    );

  }

  function addMaterialItem() {
    if (!newMaterialName.trim()) return;

    setMaterials(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newMaterialName,
        amount: Number(newMaterialAmount || 0),
      },
    ]);

    setNewMaterialName("");
    setNewMaterialAmount("");
    setShowAddMaterialModal(false);
  }

  const approvedVariationMaterials = variationRequests
  .filter((request) => request.status === "APPROVED")
  .map((request) => ({
    id: request._id,
    name: request.title,
    amount: Number(request.requestedAmount || 0),
  }));

  const approvedVariationTotal = variationRequests
    .filter((request) => request.status === "APPROVED")
    .reduce((sum, request) => sum + Number(request.requestedAmount || 0), 0);

  const materialTotal =
    materials.reduce(
      (sum, item) => sum + item.amount,
      0
    ) + approvedVariationTotal;

  const additionalChargeTotal =
    extraCharges.reduce(
      (sum, item) => sum + item.amount,
      0
    );

  const grandTotal =
    labourCost +
    electricalCost +
    plumbingCost +
    falseCeilingCost +
    paintingCost +
    materialTotal +
    additionalChargeTotal;

  const handleSubmitQuotation = async () => {

    if (!project) return;

    if (submitting) return;

    try {

      setSubmitting(true);

      // Determine attachment URL (either excel or pdf). Upload selected file(s) if needed.
      let excelUrl = quotationExcelUrl;
      let pdfUrl = quotationPdfUrl;

      if (quotationExcelFile && !excelUrl) {
        excelUrl = await uploadQuotationFile(quotationExcelFile);
        setQuotationExcelUrl(excelUrl);
        setQuotationExcelName(quotationExcelFile.name);
      }

      if (quotationPdfFile && !pdfUrl) {
        pdfUrl = await uploadQuotationFile(quotationPdfFile);
        setQuotationPdfUrl(pdfUrl);
        setQuotationPdfName(quotationPdfFile.name);
      }

      console.log("===== SUBMITTING QUOTATION =====");
      console.log("Excel URL:", excelUrl);
      console.log("PDF URL:", pdfUrl);

      await projectApi.submitQuotation(project._id || project.id, {
        labourCost,
        electricalCost,
        plumbingCost,
        falseCeilingCost,
        paintingCost,
        materials,
        extraCharges,
        grandTotal,

        quotationExcel: excelUrl,
        quotationPdf: pdfUrl,
      });

      alert("Quotation submitted successfully!");
      setQuotationSubmitted(true);

      setSubmitting(false);

      router.push("/contractor/dashboard");

    } catch (error: any) {

      console.error(error);

      alert(error?.message || "Failed to submit quotation");

      setSubmitting(false);

    }

  };


  const handleAcceptProject = async () => {
    try {
      await projectApi.acceptProject(project._id || project.id);

      alert("Project accepted successfully.");

      fetchProject();
    } catch (err) {
      console.error(err);
      alert("Unable to accept project.");
    }
  };

  const handleVisitSite = async () => {
  try {
    await apiRequest(`/projects/${project._id || project.id}/visit-site`, {
      method: "PUT",
    });

    alert("Site Visit Completed Successfully.");

    fetchProject();
  } catch (error) {
    console.error(error);
    alert("Failed to complete Site Visit.");
  }
};

  const handleCheckIn = async () => {
  try {
    setCheckingIn(true);

    await apiRequest(
      `/attendance/${project._id || project.id}/check-in`,
      {
        method: "POST",
      }
    );

    alert("Attendance marked successfully.");

    const attendanceResponse: any = await apiRequest(
      `/attendance/${project._id || project.id}/today`
    );

    setTodayAttendance(attendanceResponse.attendance);

  } catch (error: any) {
    console.error(error);

    alert(
      error?.message ||
      "Failed to mark attendance."
    );
  } finally {
    setCheckingIn(false);
  }
};

  const handleOpenDesign = () => {
    if (project?.designFiles?.length > 0) {
      openFile(project.designFiles[0].fileUrl);
      return;
    }
    router.push(`/contractor/project/${id}?tab=design`);
  };

  const deadlinePassed =
    project?.quotationDeadline
      ? new Date(project.quotationDeadline) < new Date()
      : false;

  const quotationClosed =
    deadlinePassed ||
    project?.status === "CLIENT_COMPARISON" ||
    project?.status === "CONTRACTOR_SELECTED" ||
    project?.status === "CONTRACTOR_CONFIRMED" ||
    project?.status === "WORK_STARTED" ||
    project?.status === "IN_PROGRESS" ||
    project?.status === "COMPLETION_VERIFICATION" ||
    project?.status === "PROJECT_COMPLETED";

  const projectStatusInfo = (() => {

    if (deadlinePassed) {
      return {
        text: "BIDDING CLOSED",
        bg: "bg-red-100",
        color: "text-red-700",
      };
    }

    switch (project?.status) {
      case "CONTRACTOR_CONFIRMED":
        return {
          text: "PROJECT ACCEPTED",
          bg: "bg-green-100",
          color: "text-green-700",
        };

      case "WORK_STARTED":
        return {
          text: "WORK STARTED",
          bg: "bg-blue-100",
          color: "text-blue-700",
        };

      case "IN_PROGRESS":
        return {
          text: "IN PROGRESS",
          bg: "bg-blue-100",
          color: "text-blue-700",
        };

      case "COMPLETION_VERIFICATION":
        return {
          text: "COMPLETION VERIFICATION",
          bg: "bg-yellow-100",
          color: "text-yellow-700",
        };

      case "PROJECT_COMPLETED":
        return {
          text: "PROJECT COMPLETED",
          bg: "bg-green-100",
          color: "text-green-700",
        };

      default:
        return {
          text: "READY FOR QUOTATION",
          bg: "bg-orange-100",
          color: "text-orange-600",
        };
    }
  })();

  const canAcceptProject =
    project?.status === "CONTRACTOR_SELECTED";

  const projectAccepted =
    project?.status === "CONTRACTOR_CONFIRMED" ||
    project?.status === "WORK_STARTED" ||
    project?.status === "IN_PROGRESS";

  const quotationReadOnly = quotationSubmitted || quotationClosed;

  const showQuotationEditor =
    !quotationClosed || quotationSubmitted;

  const isBrowseProject = searchParams.get('from') === 'browse';
  const isWorkProject = activeNav === 'active';

  console.log("quotationExcelUrl =", quotationExcelUrl);
  console.log("quotationPdfUrl =", quotationPdfUrl);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        Loading Project...
      </div>
    );
  }

  const clientUploads =
    project?.files?.filter(
      (f: any) => f.uploadedBy === "CLIENT"
    ) || [];


  const designFiles =
    project?.files?.filter(
      (f: any) => f.meta?.category === "DESIGN"
    ) || [];

  console.log("CLIENT FILES", clientUploads);
  console.log("DESIGN FILES", designFiles);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        Project Not Found
      </div>
    );
  }

  console.log("Approved Design");
  console.log(project.approvedDesign);

  const selectedDesign = designFiles.find(
    (f: any) => String(f._id) === String(project?.approvedDesignId)
  );

  console.log("Approved Design ID:", project?.approvedDesignId);

  console.log("Selected Design:", selectedDesign);

  // Prefer the latest report, with project-level fields as a fallback for
  // completed/legacy inspections.
  const inspectionReport = project?.inspectionReport;
  const inspectionPhotos =
    inspectionReport?.photos?.length
      ? inspectionReport.photos
      : project?.inspectionPhotos || [];

  const inspectionDocuments =
    inspectionReport?.documents?.length
      ? inspectionReport.documents
      : project?.inspectionReportPdf
        ? [project.inspectionReportPdf]
        : [];

  const inspectionReportPdf = inspectionDocuments[0] || null;

  const inspectionNotes =
    inspectionReport?.notes ||
    inspectionReport?.remarks ||
    project?.inspectionNotes ||
    "";

  const inspectionDate =
    inspectionReport?.inspectionDate
      ? new Date(inspectionReport.inspectionDate).toLocaleDateString("en-GB")
      : "";

  const hasInspectionDetails =
    inspectionPhotos.length > 0 ||
    inspectionDocuments.length > 0 ||
    !!inspectionNotes;

  const coverImage =
    clientUploads.find((f: any) => f.fileType === "IMAGE")?.fileUrl ||
    project.coverImage ||
    "";

  const companyName = user?.profile?.profile?.companyName || 'Partner';
  const companyEmail = user?.email || 'contractor@example.com';
  const profileStatus = user?.profile?.profile?.status || 'PENDING_VERIFICATION';
  const isVerified = profileStatus === 'VERIFIED';

  if (isBrowseProject) {
    return (
      <BrowseQuotationPage
        router={router}
        project={project}
        loading={loading}
        companyName={companyName}
        companyEmail={companyEmail}
        activeNav="browse"
        logout={logout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <div className="min-h-screen flex">
        <aside className="hidden lg:flex w-64 bg-gradient-to-b from-primary via-primary to-primary text-white flex-col justify-between p-5 fixed top-0 bottom-0 left-0">
          <div className="space-y-8">
            <Link href="/" className="block">
              <img
                src={logoPng.href}
                alt="ConstroBID"
                className="mx-auto w-[210px] max-w-full object-contain"
              />
            </Link>

            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, href: '/contractor/dashboard?tab=overview' },
                { id: 'browse', label: 'Browse Open Projects', icon: Search, href: '/contractor/dashboard?tab=browse' },
                { id: 'active', label: 'My Construction Works', icon: Building2, href: '/contractor/dashboard?tab=active' },
                { id: 'finance', label: 'Project Finance', icon: Wallet, href: '/contractor/finance' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => router.push(btn.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeNav === btn.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                <span className="text-xs font-bold block truncate">{companyName}</span>
                <span className="text-[10px] text-gray-300 block truncate">{companyEmail}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
            >
              Logout Account
            </button>
          </div>
        </aside>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-primary text-gray-300 border-t border-[#5C1E3A] flex justify-around py-3.5 z-50 shadow-2xl">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/contractor/dashboard?tab=overview' },
            { id: 'browse', label: 'Browse', icon: Search, href: '/contractor/dashboard?tab=browse' },
            { id: 'active', label: 'Active', icon: Building2, href: '/contractor/dashboard?tab=active' },
            { id: 'finance', label: 'Finance', icon: Wallet, href: '/contractor/finance' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => router.push(btn.href)}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeNav === btn.id ? 'text-white' : 'text-white'
                }`}
            >
              <btn.icon size={18} />
              {btn.label}
            </button>
          ))}
          <button onClick={logout} className="flex flex-col items-center gap-1 text-[10px] font-bold text-white">
            <X size={18} />
            Logout
          </button>
        </nav>

        <main className="flex-1 lg:ml-64">
          <div className="min-h-screen">
            <div className="max-w-[1700px] mx-auto px-8 py-8 space-y-8 pb-24 lg:pb-8">
              {/* Back Header */}

              {/* Material Variation Requests */}

<div className="hidden col-span-3 bg-white rounded-3xl border shadow-sm p-8">

  <div className="flex items-center justify-between mb-6">

    <h2 className="text-xl font-bold text-[#70153A]">
      Material Variation Requests
    </h2>

    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
      {variationRequests.length}
    </span>

  </div>

  {variationRequests.length === 0 ? (

    <div className="rounded-xl border border-dashed p-8 text-center text-slate-400">
      No Requests Yet
    </div>

  ) : (

    <div className="space-y-4 max-h-[470px] overflow-y-auto pr-2">

  {variationRequests.map((variation: any) => {
        const statusStyle =
          variation.status === "APPROVED"
            ? "bg-green-100 text-green-700"
            : variation.status === "REJECTED"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";

        return (

          <div
            key={variation._id}
            className="rounded-2xl border p-4"
          >

            <div className="flex items-start justify-between">

              <div>

                <h3 className="font-bold">
                  {variation.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {variation.reason}
                </p>

                <p className="mt-3 font-bold text-[#70153A]">
                  ₹{Number(
                    variation.requestedAmount || 0
                  ).toLocaleString()}
                </p>

              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}
              >
                {variation.status.replaceAll("_", " ")}
              </span>

            </div>

            {variation.status === "REJECTED" &&
             variation.rejectionReason && (

              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3">

                <p className="font-semibold text-red-700">
                  Rejection Reason
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {variation.rejectionReason}
                </p>

              </div>

            )}

          </div>

        );

      })}

    </div>

  )}

</div>


                <div className="flex items-center justify-between mb-8">

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

</div>

              <div className="grid gap-6 lg:grid-cols-2">

                {/* Project Details */}

                <div className="bg-white rounded-3xl shadow-sm border p-8">
               
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

                {/* Project Summary */}

                <div className="bg-white rounded-3xl shadow-sm border p-8">

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
      {companyName || "--"} 
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

                {project?.clientContact && (
                  <div className="bg-white rounded-3xl shadow-sm border p-6">
                    <h2 className="mb-1 text-xl font-bold text-primary">Client Details</h2>
                    <p className="mb-5 text-xs text-slate-500">
                      Shared with you because this project is confirmed and accepted.
                    </p>

                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center gap-3 py-3 first:pt-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <User size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Client
                          </p>
                          <p className="truncate font-semibold text-slate-900">
                            {project.clientContact.name || "--"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Phone size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Phone
                          </p>
                          {project.clientContact.phone ? (
                            <a
                              href={`tel:${project.clientContact.phone}`}
                              className="block truncate font-semibold text-primary hover:underline"
                            >
                              {project.clientContact.phone}
                            </a>
                          ) : (
                            <p className="font-semibold text-slate-900">--</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 py-3 last:pb-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Mail size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Email
                          </p>
                          {project.clientContact.email ? (
                            <a
                              href={`mailto:${project.clientContact.email}`}
                              title={project.clientContact.email}
                              className="block truncate font-semibold text-primary hover:underline"
                            >
                              {project.clientContact.email}
                            </a>
                          ) : (
                            <p className="font-semibold text-slate-900">--</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
<div className="bg-white rounded-3xl shadow-sm border p-6">

  <h2 className="text-xl font-bold text-primary mb-6">
    Site Visit
  </h2>

  <div className="space-y-3">

    <div
      className={`rounded-xl border p-3 ${
        project?.contractorSiteVisited
          ? "border-green-200 bg-green-50"
          : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <p className="text-xs text-gray-500">
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
          className={`font-semibold ${
            project?.contractorSiteVisited
              ? "text-green-700"
              : "text-yellow-700"
          }`}
        >
          {project?.contractorSiteVisited
            ? "Visit Completed"
            : "Visit Pending"}
        </span>

      </div>

    </div>

    <div className="rounded-xl border p-3">

      <p className="text-xs text-gray-500">
        Visit Date
      </p>

      <p className="mt-2 font-semibold">
        {project?.contractorSiteVisitedAt
          ? new Date(project.contractorSiteVisitedAt).toLocaleString()
          : "Not Started"}
      </p>

    </div>

    {!project?.contractorSiteVisited && (
      <button
        onClick={handleVisitSite}
        className="w-full rounded-xl bg-primary py-2.5 text-white font-semibold hover:bg-[#5B0D28]"
      >
        Visit Site
      </button>
    )}

    {project?.contractorSiteVisited && (
      <button
        disabled
        className="w-full rounded-xl bg-green-600 py-2.5 text-white font-semibold cursor-not-allowed"
      >
        Site Visit Completed
      </button>
    )}

  </div>

</div>

              </div>

              <div className="grid grid-cols-12 gap-6">

                {/* LEFT COLUMN */}

                <div className="contents">

                  {/* Cost Breakdown */}

<div className="contents">
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
                                  <span className="text-right">Amount (&#8377;)</span>
                                </div>
                                {quotationReadOnly ? (
                                  [
                                    ["Labour Cost", labourCost],
                                    ["Electrical Cost", electricalCost],
                                    ["Plumbing Cost", plumbingCost],
                                    ["Painting Cost", paintingCost],
                                    ["False Ceiling", falseCeilingCost],
                                  ].map(([label, value]) => (
                                    <CostBreakdownRow
                                      key={label as string}
                                      label={label as string}
                                      value={Number(value || 0)}
                                    />
                                  ))
                                ) : (
                                  <>
                                    <CostInputRow label="Labour Cost" value={labourCost} onChange={setLabourCost} />
                                    <CostInputRow label="Electrical Cost" value={electricalCost} onChange={setElectricalCost} />
                                    <CostInputRow label="Plumbing Cost" value={plumbingCost} onChange={setPlumbingCost} />
                                    <CostInputRow label="Painting Cost" value={paintingCost} onChange={setPaintingCost} />
                                    <CostInputRow label="False Ceiling" value={falseCeilingCost} onChange={setFalseCeilingCost} />
                                  </>
                                )}
                                <CostBreakdownRow
                                  label="Materials"
                                  value={materialTotal}
                                  icon={<Package className="h-4 w-4" />}
                                  onClick={() => setIsMaterialsView(true)}
                                />
                                <CostBreakdownTotal label="Grand Total" value={grandTotal} />
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
                                  <span className="text-right">Amount (&#8377;)</span>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto">
                                  {materials.map((item, index) => (
                                    <CostBreakdownRow
                                      key={item.id ?? index}
                                      label={item.name}
                                      value={item.amount}
                                      icon={
                                        !quotationReadOnly ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeMaterial(item.id);
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        ) : undefined
                                      }
                                    />
                                  ))}
                                  {approvedVariationMaterials.map((item, index) => (
                                    <CostBreakdownRow
                                      key={item.id ?? `variation-${index}`}
                                      label={item.name}
                                      value={item.amount}
                                    />
                                  ))}
                                </div>
                                {!quotationReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAddMaterialModal(true)}
                                    className="border-t px-5 py-3 text-left font-semibold text-[#70153A] hover:bg-slate-50"
                                  >
                                    + Add Material
                                  </button>
                                )}
                                <CostBreakdownTotal label="Material Total" value={materialTotal} />
                                <CostBreakdownTotal label="Grand Total" value={grandTotal} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="hidden col-span-3 bg-white rounded-3xl border shadow-sm p-8">
                      <h2 className="text-xl font-bold text-[#70153A] mb-6">
                        Additional Charges
                      </h2>

                      {extraCharges.length ? (
                        extraCharges.map((item, index) => (
                          <div key={item.id ?? index} className="flex justify-between items-center mb-4">
                            <span>{item.name}</span>
                            <span className="flex items-center gap-3">
                              &#8377;{Number(item.amount || 0).toLocaleString()}
                              {!quotationReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => removeCharge(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400">No Additional Charges</p>
                      )}

                      <div className="border-t mt-4 pt-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => setIsMaterialsView(true)}
                          className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-600" />
                            Materials
                          </span>
                          <span className="flex items-center gap-2 font-semibold text-green-600">
                            &#8377;{Number(materialTotal || 0).toLocaleString()}
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </button>

                        {!quotationReadOnly && (
                          <button
                            type="button"
                            onClick={() => setShowChargeModal(true)}
                            className="w-full rounded-xl bg-[#70153A] py-2 text-white font-semibold hover:bg-[#5d1031]"
                          >
                            Add Charge
                          </button>
                        )}

                        {projectAccepted && (
                          <button
                            type="button"
                            onClick={() => setShowMaterialModal(true)}
                            className="w-full rounded-xl border border-[#70153A] py-2 text-[#70153A] font-semibold hover:bg-[#70153A]/5"
                          >
                            Request Variation
                          </button>
                        )}
                      </div>

                      {showChargeModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-white/30 backdrop-blur-sm opacity-25"
                            onClick={() => setShowChargeModal(false)}
                          />
                          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 border-2 border-[#70153A]/10">
                            <h3 className="text-lg font-bold mb-4">Add Additional Charge</h3>

                            <div className="space-y-3">
                              <div>
                                <label className="text-sm text-slate-500">Charge Name</label>
                                <input
                                  value={chargeName}
                                  onChange={(e) => setChargeName(e.target.value)}
                                  className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                  placeholder="e.g. Transportation"
                                />
                              </div>

                              <div>
                                <label className="text-sm text-slate-500">Amount (₹)</label>
                                <input
                                  value={chargeAmount}
                                  onChange={(e) => setChargeAmount(e.target.value)}
                                  className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                  placeholder="5000"
                                  inputMode="numeric"
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => setShowChargeModal(false)}
                                  className="rounded-lg px-4 py-2 border border-[#70153A]/10"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={addCharge}
                                  className="rounded-lg bg-primary px-4 py-2 text-white text-l"
                                >
                                  Add Charge
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {showAddMaterialModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-white/30 backdrop-blur-sm opacity-25"
                            onClick={() => setShowAddMaterialModal(false)}
                          />
                          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 border-2 border-[#70153A]/10">
                            <h3 className="text-lg font-bold mb-4">Add Material</h3>

                            <div className="space-y-3">
                              <div>
                                <label className="text-sm text-slate-500">Material Name</label>
                                <input
                                  value={newMaterialName}
                                  onChange={(e) => setNewMaterialName(e.target.value)}
                                  className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                  placeholder="e.g. Cement (10 bags)"
                                />
                              </div>

                              <div>
                                <label className="text-sm text-slate-500">Amount (₹)</label>
                                <input
                                  value={newMaterialAmount}
                                  onChange={(e) => setNewMaterialAmount(e.target.value)}
                                  className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                  placeholder="5000"
                                  inputMode="numeric"
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => setShowAddMaterialModal(false)}
                                  className="rounded-lg px-4 py-2 border border-[#70153A]/10"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={addMaterialItem}
                                  className="rounded-lg bg-primary px-4 py-2 text-white text-l"
                                >
                                  Add Material
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                      {showMaterialModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-white/30 backdrop-blur-sm opacity-25"
                            onClick={() => setShowMaterialModal(false)}
                          />
                            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 border-2 border-[#70153A]/10">
                              <h3 className="text-lg font-bold mb-4">
  New Variation Request
</h3>

                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-slate-500">
  Request Title
</label>
                                  <input
                                    value={materialName}
                                    onChange={(e) => setMaterialName(e.target.value)}
                                    className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                    placeholder="e.g. Extra Cement for Foundation"
                                  />
                                </div>

                                <div>
  <label className="text-sm text-slate-500">Reason</label>

  <textarea
    value={variationReason}
    onChange={(e) => setVariationReason(e.target.value)}
    className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
    placeholder="Explain why this additional work is required"
    rows={3}
  />
</div>

                                <div>
                                  <label className="text-sm text-slate-500">Amount (₹)</label>
                                  <input
                                    value={materialPrice}
                                    onChange={(e) => setMaterialPrice(e.target.value)}
                                    className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-[#70153A]/10"
                                    placeholder="20000"
                                    inputMode="numeric"
                                  />
                                </div>

                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => setShowMaterialModal(false)}
                                    className="rounded-lg px-4 py-2 border border-[#70153A]/10"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    onClick={() => {
  submitVariationRequest();
}}
                                    className="rounded-lg bg-primary px-4 py-2 text-white text-l"
                                  >
                                    Submit Request
                                  </button>
                                </div>
                              </div>
                            </div>
                        </div>
                      )}

                    </div>
                  </div>

                  
                  <div className="col-span-12 space-y-6">

                    {(
                      <div className="bg-white rounded-3xl border shadow-sm p-6">
                        <h2 className="text-xl font-bold text-primary mb-6">
                            Quotation Attachments
                        </h2>

                  {!quotationReadOnly && !isWorkProject && (
                    <label
                      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition
    ${quotationReadOnly
                          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60 pointer-events-none"
                          : "border-primary/30 cursor-pointer hover:bg-primary/5"
                        }`}
                    >
                      
                      <p className="font-semibold text-gray-700">
                        {quotationReadOnly
                          ? "Quotation already submitted"
                          : "Upload Quotation Attachment"}
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        {quotationReadOnly
                          ? "Attachment cannot be modified."
                          : ".xlsx, .xls or .pdf (Maximum 10 MB)"}
                      </p>

                      <input
                        type="file"
                        accept=".xlsx,.xls,.pdf"
                        disabled={quotationReadOnly}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];

                          if (!f) return;

                          const extension = f.name.split(".").pop()?.toLowerCase();
                          if (!extension || !["xlsx", "xls", "pdf"].includes(extension)) {
                            alert("Please select an Excel (.xlsx, .xls) or PDF file.");
                            e.target.value = "";
                            return;
                          }

                          if (f.size > 10 * 1024 * 1024) {
                            alert("The quotation attachment must be 10 MB or smaller.");
                            e.target.value = "";
                            return;
                          }

                          if (extension === "pdf") {
                            setQuotationPdfFile(f);
                            setQuotationPdfName(f.name);
                            setQuotationPdfUrl(null);

                            setQuotationExcelFile(null);
                            setQuotationExcelName(null);
                            setQuotationExcelUrl(null);
                          } else {
                            setQuotationExcelFile(f);
                            setQuotationExcelName(f.name);
                            setQuotationExcelUrl(null);

                            setQuotationPdfFile(null);
                            setQuotationPdfName(null);
                            setQuotationPdfUrl(null);
                          }
                        }}
                      />
                    </label>
                  )}

                  {!quotationReadOnly && !isWorkProject && (quotationExcelFile || quotationPdfFile) && (
                    <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-700">
                            {quotationPdfFile?.name || quotationExcelFile?.name}
                          </p>
                          <p className="text-sm text-green-700">Attachment selected. It will upload when you submit the quotation.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQuotationExcelFile(null);
                          setQuotationExcelName(null);
                          setQuotationExcelUrl(null);
                          setQuotationPdfFile(null);
                          setQuotationPdfName(null);
                          setQuotationPdfUrl(null);
                        }}
                        className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {(quotationExcelUrl || quotationPdfUrl) ? (
                    <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">

                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                        {/* Left Side */}

                        <div className="flex items-center gap-4">


                          <div>
  <p className="font-semibold text-lg text-slate-900">
    Submitted by Contractor
  </p>
  <p className="mt-1 text-sm text-emerald-700">
    Quotation files are saved and available to view.
  </p>

</div>

                        </div>

                        {/* Right Side */}

                        <div className="flex flex-wrap gap-3">


                          {(quotationExcelUrl || quotationPdfUrl) && (
                            <div className="flex items-center gap-3">

                              {/* PDF */}
                              {quotationPdfUrl && (
                                <button
                                  onClick={() => openFile(quotationPdfUrl)}
                                  className="rounded-xl border border-[#70153A] px-4 py-2 flex items-center gap-2 text-[#70153A] hover:bg-white"
                                >
                                  <Eye className="w-4 h-4" />
                                  View PDF
                                </button>
                              )}

                              {/* Excel */}
                              {quotationExcelUrl && (
                                <button
                                  onClick={() => openFile(quotationExcelUrl)}
                                  className="rounded-xl bg-primary text-white px-4 py-2 flex items-center gap-2 hover:bg-[#5B0D28]"
                                >
                                  <Download className="w-4 h-4" />
                                  View Excel
                                </button>
                              )}

                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                      No quotation PDF or Excel attachment was submitted.
                    </div>
                  )}

                  {!quotationReadOnly && !isWorkProject && (
                    <button
                      type="button"
                      onClick={handleSubmitQuotation}
                      disabled={submitting || uploadingQuotationFile}
                      className="mt-6 w-full rounded-xl bg-[#70153A] py-3.5 text-lg font-semibold text-white shadow hover:bg-[#5B0D28] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit Quotation"}
                    </button>
                  )}

                  </div>
                )}
                <div className="hidden bg-white rounded-3xl border shadow-sm p-6">

  <h2 className="text-xl font-bold text-primary mb-5">
    Contractor Attendance
  </h2>

  <div
  className={`rounded-2xl border p-4 ${
    todayAttendance
      ? "border-green-200 bg-green-50"
      : "border-red-200 bg-red-50"
  }`}
>

    <div className="flex items-center justify-between">

      <div>

        <p className="text-xs text-gray-500">
          Attendance Status
        </p>

        <div className="mt-2 flex items-center gap-2">

          <div
  className={`h-3 w-3 rounded-full ${
    todayAttendance ? "bg-green-500" : "bg-red-500"
  }`}
/>

<span
  className={`text-xl font-bold ${
    todayAttendance ? "text-green-600" : "text-red-600"
  }`}
>
  {todayAttendance ? "Present" : "Not Present"}
</span>

        </div>

      </div>

      <span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${
    todayAttendance
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-600"
  }`}
>
  {todayAttendance ? "Present Today" : "Awaiting Check In"}
</span>

    </div>

  </div>

  <div className="mt-4 flex items-center justify-between rounded-xl border p-4">

    <div>

      <p className="text-xs text-gray-500">
        Check In
      </p>

      <div className="mt-1">
  {todayAttendance?.checkInTime ? (
    <>
      <p className="font-semibold">
        {new Date(todayAttendance.checkInTime).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>

      <p className="text-sm text-gray-500">
        {new Date(todayAttendance.checkInTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </>
  ) : (
    <p className="font-semibold">-- : --</p>
  )}
</div>

    </div>

    <button
  onClick={handleCheckIn}
  disabled={checkingIn || !!todayAttendance}
  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
    checkingIn || todayAttendance
      ? "bg-green-600 cursor-not-allowed"
      : "bg-primary hover:bg-[#5B0D28]"
  }`}
>
  {checkingIn
    ? "Checking In..."
    : todayAttendance
    ? "Present"
    : "Check In"}
</button>

  </div>

</div>
                </div>
              </div>
              {/* RIGHT COLUMN */}



              <div className="col-span-12 grid grid-cols-12 gap-6">

                {projectAccepted && (
  <div className="hidden col-span-3 bg-white rounded-3xl border border-gray-200 p-6">

                    <div className="flex items-center justify-between mb-5">

  <h2 className="text-xl font-bold text-primary">
    Payment
  </h2>

  <span className="text-xs text-gray-500">
    {new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
  </span>

</div>
                    <div className="space-y-4">

                      <button
                        className="w-full rounded-xl bg-primary text-white py-3 font-semibold"
                      >
                        Daily Progress Updates
                      </button>

                      <button
                        className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold"
                      >
                        Upload Site Photos
                      </button>

                      <button
                        className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold"
                      >
                        Request Completion
                      </button>

                    </div>

                  </div>
                )}
                <div className="col-span-12">
  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
                  <h2 className="text-xl font-bold text-primary mb-6">
                    Project Resources
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-6 rounded-2xl bg-gray-50 p-2">

                    {[
                      { id: "design", label: "Design" },
                      { id: "uploads", label: "Uploads" },
                      { id: "inspection", label: "Inspection" },
                    ].map((tab) => (

                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                            ? "bg-primary text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {tab.label}
                      </button>

                    ))}
                    </div>
</div>

                {activeTab === "design" && (

                  <div className="bg-white rounded-3xl border border-gray-200 p-5">

                    {activeTab === "design" && (

                      <h2 className="text-xl font-bold text-primary mb-5">
                        Design
                      </h2>
                    )}


                    {selectedDesign ? (

                      <div className="space-y-6">

                        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                          <p className="text-green-700 font-semibold">
                            ✓ Client has approved these files
                          </p>
                        </div>
                        {/* DESIGN */}

                        {selectedDesign && (

                          <div className="border border-green-300 bg-green-50 rounded-xl px-5 py-4 flex items-center justify-between min-h-[95px]">

                            <div>

                              <div className="flex flex-col gap-2">

                                <div className="flex items-center gap-2">
                                  <Home className="w-6 h-6 text-green-600" />
                                  <h3 className="font-bold text-xl">
                                    Design Version {designFiles.findIndex(
                                      (f: any) => String(f._id) === String(project.approvedDesignId)
                                    ) + 1}
                                  </h3>
                                </div>

                                <span className="inline-flex w-fit px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                  ✓ Approved by Client
                                </span>

                              </div>

                            </div>

                            <button
                              onClick={() => openFile(selectedDesign.fileUrl)}
                              className="w-28 h-11 rounded-xl bg-primary text-white font-semibold hover:bg-[#5B0D28] transition"
                            >
                              View Design
                            </button>

                          </div>

                        )}

                      </div>

                    ) : (

                      <div className="text-gray-500">
                        No approved Design available.
                      </div>

                    )}

                  </div>
                )}

                {activeTab === "uploads" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 p-5">

                      <h2 className="text-xl font-bold text-primary mb-5">
                        CLIENT UPLOADS
                      </h2>

                      {clientUploads.length > 0 ? (

                        <div className="variation-scroll space-y-4">

                          {clientUploads.map((file: any, index: number) => (

                            <div
                              key={file._id}
                              className="flex items-center justify-between border rounded-2xl p-4"
                            >

                              <div className="flex items-center gap-4">



                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                  {file.fileType === "IMAGE" ? (
                                    <Image className="w-6 h-6 text-primary" />
                                  ) : (
                                    <FileText className="w-6 h-6 text-primary" />
                                  )}
                                </div>



                                <div>


                                  <h3 className="font-semibold">

                                    Client Upload {index + 1}

                                  </h3>

                                  <p className="text-sm text-gray-500">

                                    {file.fileType}

                                  </p>

                                </div>

                              </div>

                              <button
                                onClick={() => openFile(file.fileUrl)}
                                className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-[#5B0D28]"
                              >
                                View
                              </button>



                            </div>

                          ))}

                        </div>

                      ) : (

                        <div className="text-center py-8 text-gray-500">

                          No client files uploaded.

                        </div>
                      )}

                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 p-5">

                      <h2 className="text-xl font-bold text-primary mb-5">
                        CLIENT REQUIREMENTS
                      </h2>

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                        <div className="flex items-start gap-3">

                          <div className="text-3xl">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                              <ClipboardList className="w-6 h-6 text-green-600" />
                            </div>

                          </div>

                          <div>


                            <p className="font-semibold text-gray-800 mb-2">
                              Project Description
                            </p>

                            <p className="text-gray-700 leading-7 whitespace-pre-wrap">

                              {project?.description || "No requirements provided by the client."}

                            </p>

                          </div>

                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {activeTab === "inspection" && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-5">

                    <h2 className="font-bold text-primary mb-5 text-xl">
                      INSPECTION DETAILS
                    </h2>

                    {hasInspectionDetails || inspectionReport ? (
                      <div className="space-y-5">


                        {/* Inspection Photos */}
                        {inspectionPhotos.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Camera className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold text-gray-800">Inspection Photos</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {inspectionPhotos.map((photo: string, index: number) => (
                                <div key={`${photo}-${index}`} className="relative">
                                  <img
                                    src={photo}
                                    alt={`Inspection photo ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition cursor-pointer"
                                    onClick={() => openFile(photo)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inspection Report PDF */}
                        {inspectionDocuments.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <FileCheck className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold text-gray-800">Inspection Report</h3>
                            </div>
                            <div className="space-y-2">
                              {inspectionDocuments.map((doc: string, index: number) => (
                                <button
                                  key={`${doc}-${index}`}
                                  onClick={() => openFile(doc)}
                                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">
                                      Report {index + 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Click to view
                                    </p>
                                  </div>
                                  <span className="text-primary font-semibold">
                                    View
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inspection Notes */}
                        {inspectionNotes && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <StickyNote className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold text-gray-800">Inspector Notes & Observations</h3>
                            </div>
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                {inspectionNotes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Empty state if no data */}
                        {inspectionPhotos.length === 0 && inspectionDocuments.length === 0 && !inspectionNotes && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No inspection details available yet.</p>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Inspection not yet completed.</p>
                      </div>
                    )}
                  </div>  
                )}
                </div>
              </div>
            </div>

            {!isVerified && (
              <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-3 flex items-start gap-4 shadow-sm">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-base font-bold text-amber-800 font-serif">Account Verification Pending</h3>
                  <p className="text-xs text-amber-700 leading-relaxed mt-1">
                    Your profile is being reviewed. You will unlock full contractor access once verification is complete.
                  </p>
                </div>
              </div>
            )}



            </div>	
          </div>
        </main>
      </div>
    </div>
  );
}

