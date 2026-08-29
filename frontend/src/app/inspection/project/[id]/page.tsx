"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from '@/components/inspection/Sidebar';
import DateTimePickerModal from '@/components/common/DateTimePickerModal';
import ConstructionProject from "./ConstructionProject";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Clock,
  ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { projectApi, apiRequest } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import Image from "next/image";
import logoPng from "../../../../../assets/Logo.png";

export default function ProjectInspectionPage() {
  const params = useParams();
  const { setNotification } = useNotification();
  const id = params.id as string;
  console.log("Route params:", params);
  console.log("Project ID:", id);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const clientFiles =
  project?.files?.filter(
    (file: any) => file.uploadedBy === "CLIENT"
  ) || [];


const byNewestFirst = (a: any, b: any) =>
  new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();

const designFiles = (
  project?.files?.filter(
    (file: any) => file.meta?.category === "DESIGN"
  ) || []
).sort(byNewestFirst);

const boqFiles = (
  project?.files?.filter(
    (file: any) => file.meta?.category === "BOQ"
  ) || []
).sort(byNewestFirst);

const latestExcelBoq = boqFiles.find((file: any) => {
  const name = String(file?.meta?.originalName || file?.fileName || file?.fileUrl || "")
    .split("?")[0]
    .toLowerCase();
  return name.endsWith(".xls") || name.endsWith(".xlsx");
});

// What the client actually confirmed. Design uses approvedDesignId, which the
// client confirmation sets alongside selectedDesignId.
const approvedDesignFile = designFiles.find(
  (file: any) =>
    String(file._id) === String(project?.approvedDesignId) ||
    String(file._id) === String(project?.selectedDesignId)
);

const approvedBoqFile = boqFiles.find(
  (file: any) => String(file._id) === String(project?.selectedBoqId)
);

const versionLabel = (files: any[], target: any) => {
  const index = files.findIndex((file: any) => String(file._id) === String(target?._id));
  return index < 0 ? "" : `V${files.length - index}`;
};

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  async function fetchProject() {
    setLoading(true);
    try {
      const resp = await projectApi.getById(id);
      console.log("FULL PROJECT RESPONSE:", JSON.stringify(resp, null, 2));
      console.log("designFiles =", resp.designFiles);
console.log("approvedDesignId =", resp.approvedDesignId);
if (resp) {
  setProject(resp);

  setInspectionPhotos(resp.inspectionPhotos || []);

  setInspectionPdf(resp.inspectionReportPdf || "");

  setInspectionNotes(resp.inspectionNotes || "");
}
      else {
        // fallback sample data for preview
        setProject({
          id: "PRJ-2025-000124",
          title: "Villa Construction",
          clientName: "Mohan Krishna",
          phone: "+91 98765 43210",
          category: "Interior Design",
          propertyType: "Villa",
          budget: "₹2,00,000",
          city: "Bangalore",
          address: "123, 4th Cross, Koramangala 5th Block, Bangalore - 560095, Karnataka",
          createdDate: "2025-06-12",
          assignedTo: "Ravi Kumar",
          status: "Pending Inspection",
          clientRequirements:
            "I need The Villa in a Good Interior Work with modern design, modular kitchen, false ceiling, wardrobes and premium quality materials.",
          attachments: [
            { name: "Layout Plan.pdf", size: "1.2 MB" },
          ],
          photos: [
            "/images/sample/livingroom.jpg",
            "/images/sample/kitchen.jpg",
            "/images/sample/exterior.jpg",
            "/images/sample/foundation.jpg",
            "/images/sample/electrical.jpg",
          ],
          notes: [
            "Observed minor cracks near staircase area.",
            "Electrical conduits installed correctly but DB panel labeling is incomplete.",
            "Plumbing drainage slope is not proper in washroom.",
            "Overall quality is good. Client requirements are on track.",
          ],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Action handlers wired to backend
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);

const [quotationDeadlineDate, setQuotationDeadlineDate] = useState(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
});

const [quotationDeadlineTime, setQuotationDeadlineTime] = useState("18:00");
  const [scheduleDate, setScheduleDate] = useState(() => {
  const d = new Date();
  const inspectionCompleted =
  project?.inspectionCompleted ||
  !!project?.inspectionReportPdf ||
  (project?.inspectionPhotos?.length ?? 0) > 0 ||
  !!project?.inspectionNotes;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [scheduleTime, setScheduleTime] = useState('10:30');

  // Inspection evidence states
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [inspectionPdf, setInspectionPdf] = useState<string>('');
  const [inspectionNotes, setInspectionNotes] = useState<string>('');
  // Completed evidence is read-only until the inspector deliberately unlocks it.
  const [editingEvidence, setEditingEvidence] = useState<boolean>(false);
  const inspectionCompleted =
  [
    "INSPECTION_COMPLETED",
    "DESIGN_CREATION",
    "PROJECT_PUBLISHED",
    "BIDDING_OPEN",
    "CONTRACTOR_SELECTED",
    "CONTRACTOR_CONFIRMED",
    "WORK_STARTED",
    "IN_PROGRESS",
    "COMPLETION_VERIFICATION",
    "PROJECT_COMPLETED",
  ].includes(project?.status);
  const isProjectPublished =
  project?.status === "PROJECT_PUBLISHED";

  const designConfirmed =
    !!project?.clientApproved &&
    !!project?.approvedDesignId;

  const showScheduleControls = !designConfirmed;
  const showApprovalActions =
  !project?.inspectorApproved &&
  [
    "INSPECTION_COMPLETED",
    "DESIGN_CREATION",
    "DESIGN_APPROVED",
  ].includes(project?.status);
  const inspectionEvidenceComplete =
    inspectionPhotos.length > 0 &&
    !!inspectionPdf &&
    inspectionNotes.trim().length >= 5;
  // Hard lock: the report is already part of an approved or downstream record,
  // so it must not be edited at all.
  const inspectionEvidenceHardLocked =
  project?.clientApproved ||
  project?.inspectorApproved ||
  [
    "DESIGN_APPROVED",
    "PROJECT_PUBLISHED",
    "BIDDING_OPEN",
    "CONTRACTOR_SELECTED",
    "CONTRACTOR_CONFIRMED",
    "WORK_STARTED",
    "IN_PROGRESS",
    "COMPLETION_VERIFICATION",
    "PROJECT_COMPLETED",
  ].includes(project?.status);

  // A completed inspection is read-only by default: the photos, PDF and notes
  // are the record the client and contractor act on. The inspector can still
  // unlock it deliberately to correct a wrong upload.
  const inspectionEvidenceLocked =
    inspectionEvidenceHardLocked || (inspectionCompleted && !editingEvidence);

  const canEditCompletedEvidence =
    inspectionCompleted && !inspectionEvidenceHardLocked;

  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadingBoq, setUploadingBoq] = useState<boolean>(false);

  const handleScheduleVisit = () => {
    setShowScheduleModal(true);
  };

  const submitSchedule = async () => {
    try {
      // Combine date and time into an ISO datetime
      const combined = `${scheduleDate}T${scheduleTime}:00`;
      const iso = new Date(combined).toISOString();
      await projectApi.scheduleInspection(project._id || project.id, iso);
      setShowScheduleModal(false);
      await fetchProject();
      setNotification({
        type: 'success',
        message: 'Inspection scheduled'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || String(err)
      });
    }
  };

  // Discard unsaved edits and re-lock, restoring whatever the project holds.
  const cancelEvidenceEdit = () => {
    setInspectionPhotos(project?.inspectionPhotos || []);
    setInspectionPdf(project?.inspectionReportPdf || "");
    setInspectionNotes(project?.inspectionNotes || "");
    setEditingEvidence(false);
  };

  // Persist corrections to an already-completed report, then re-lock it.
  const saveEvidenceEdit = async () => {
    await handleMarkComplete();
    setEditingEvidence(false);
  };

  const handleMarkComplete = async () => {

  try {
    const missingItems: string[] = [];

    console.log("Photos:", inspectionPhotos);
    console.log("PDF:", inspectionPdf);
    console.log("Notes:", inspectionNotes);

    if (!inspectionPhotos || inspectionPhotos.length < 1) {
      missingItems.push("Inspection Photo");
    }

    if (!inspectionPdf) {
      missingItems.push("Inspection PDF");
    }

    if (!inspectionNotes || inspectionNotes.trim().length < 5) {
      missingItems.push("Inspection Notes");
    }


    if (missingItems.length > 0) {
  alert(
    `Please complete the following before marking inspection complete:\n\n${missingItems.join("\n")}`
  );

  return;
}

    const payload = {
      reportId: latestInspectionReport?._id,
      notes: inspectionNotes,
      photos: inspectionPhotos,
      reportFileUrl: inspectionPdf,
      inspectionDate: new Date().toISOString(),
    };

    await projectApi.submitReport(
      project._id || project.id,
      payload
    );
    await apiRequest(
      `/projects/${project._id || project.id}/inspection-complete`,
      {
       method: 'PUT'
      }
    );

    await fetchProject();

    setNotification({
      type: "success",
      message: "Inspection marked complete"
    });

  } catch (err: any) {
    console.error("COMPLETE ERROR:", err);

    alert("ERROR: " + (err.message || String(err)));

    setNotification({
      type: "error",
      message: err.message || String(err)
    });
  }
};

  const handleReschedule = () => {
    // Prefill modal with current scheduled inspection date/time if available
    const raw = latestInspectionReport?.scheduledDate || latestInspectionReport?.inspectionDate || null;
    if (raw) {
      const d = new Date(raw);
      setScheduleDate(d.toISOString().slice(0, 10));
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setScheduleTime(`${hh}:${mm}`);
    }
    setShowScheduleModal(true);
  };

  const handleUploadPhotoUrl = async () => {
    try {
      const url = window.prompt('Paste photo URL to upload');
      if (!url) return;
      await projectApi.submitSiteVisit(project._id || project.id, { reportType: 'PHOTO_UPLOAD', notes: 'Photo uploaded via inspector', photos: [url] });
      await fetchProject();
      setNotification({
        type: 'success',
        message: 'Photo uploaded'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || String(err)
      });
    }
  };

  const isDesignConfirmedForApproval = () =>
    !!project?.clientApproved &&
    !!project?.approvedDesignId;

  const handleApproveProject = async () => {
    if (!isDesignConfirmedForApproval()) {
      setNotification({
        type: 'warning',
        message: 'Client must confirm a design before approval.'
      });
      return;
    }

    setShowQuotationModal(true);
return;
  };

  const handleRequestChanges = async () => {
    try {
      const reason = window.prompt('Describe requested changes for client');
      if (!reason) return;
      await projectApi.raiseDispute(project._id || project.id, reason);
      await fetchProject();
      setNotification({
        type: 'success',
        message: 'Change request recorded'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || String(err)
      });
    }
  };

  const handleRejectInspection = async () => {
    try {
      const reason = window.prompt('Reason for rejection');
      console.log("Reason entered:", reason);
      if (!reason) return;
      await projectApi.raiseDispute(project._id || project.id, reason);
      await fetchProject();
      setNotification({
        type: 'success',
        message: 'Inspection rejected and dispute logged'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || String(err)
      });
    }
  };

  const handleGeneratePdf = async () => {
    try {
      await apiRequest(`/projects/${project._id || project.id}/report/generate`, { method: 'POST' });
      setNotification({
        type: 'success',
        message: 'PDF generation requested. Check reports tab.'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Failed to request PDF generation: ' + (err.message || String(err))
      });
    }
  };

  // Upload handlers for inspection evidence
  const handlePhotoFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('images', f));
      const res: any = await apiRequest('/uploads', { method: 'POST', body: form });
      console.log("UPLOAD RESPONSE:", res);
      const urls = (res || []).map((r: any) => r.url).filter(Boolean);
      if (urls.length) setInspectionPhotos((p) => [...p, ...urls]);
      else setNotification({
        type: 'warning',
        message: 'No upload URLs returned'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Photo upload failed: ' + (err.message || String(err))
      });
    } finally {
      setUploading(false);
      // reset input
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setNotification({
        type: 'warning',
        message: 'Please upload a PDF file'
      });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('images', file);
      const res: any = await apiRequest('/uploads', { method: 'POST', body: form });
      const url = res && res[0] && res[0].url;
      if (url) setInspectionPdf(url);
      else setNotification({
        type: 'warning',
        message: 'No upload URL returned for PDF'
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'PDF upload failed: ' + (err.message || String(err))
      });
    } finally {
      setUploading(false);
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  // Uploading through /messages/upload keeps one path for BOQ files: it stores
  // the ProjectFile as category BOQ and posts it into the project conversation,
  // so the client sees the new version too.
  const handleBoqFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const notExcel = files.find((f) => !/.(xls|xlsx)$/i.test(f.name));
    if (notExcel) {
      setNotification({
        type: 'warning',
        message: 'The BOQ must be an Excel file (.xls or .xlsx).',
      });
      try { (e.target as HTMLInputElement).value = ''; } catch {}
      return;
    }

    setUploadingBoq(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('images', f));
      form.append('projectId', String(project?._id || project?.id || id));
      form.append('fileCategory', 'BOQ');

      await apiRequest('/messages/upload', { method: 'POST', body: form });
      await fetchProject();

      setNotification({
        type: 'success',
        message: 'BOQ uploaded. The client and contractors can see the new version.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'BOQ upload failed: ' + (err.message || String(err)),
      });
    } finally {
      setUploadingBoq(false);
      try { (e.target as HTMLInputElement).value = ''; } catch {}
    }
  };

  const handleRemoveBoq = async (fileId: string) => {
    if (!window.confirm('Remove this BOQ? Clients and contractors will no longer see it.')) return;

    setUploadingBoq(true);
    try {
      await apiRequest(`/projects/${project?._id || project?.id || id}/boq/${fileId}`, {
        method: 'DELETE',
      });
      await fetchProject();

      setNotification({ type: 'success', message: 'BOQ removed.' });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Could not remove the BOQ: ' + (err.message || String(err)),
      });
    } finally {
      setUploadingBoq(false);
    }
  };

  const removePhoto = (url: string) => {
    // Deleting submitted evidence should never be a single stray click.
    if (!window.confirm("Remove this inspection photo from the report?")) return;
    setInspectionPhotos((p) => p.filter((x) => x !== url));
  };

  // populate local evidence state when project loads
  useEffect(() => {
  if (!project) return;

  setInspectionPhotos(project.inspectionPhotos || []);

  setInspectionPdf(project.inspectionReportPdf || "");

  setInspectionNotes(project.inspectionNotes || "");
}, [project]);

const constructionStatuses = [
  "CONTRACTOR_CONFIRMED",
  "WORK_STARTED",
  "IN_PROGRESS",
  "COMPLETION_VERIFICATION",
  "PROJECT_COMPLETED",
];

if (
  project &&
  constructionStatuses.includes(project.status)
) {
  return <ConstructionProject />;
}

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-t-2 border-primary rounded-full" />
      </div>
    );

  if (!project)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-600">Project not found</p>
      </div>
    );

  // pick a client-uploaded image (if any)
  const isImageFile = (f: any) => {
    const fileType = String(f.fileType || '').toLowerCase();
    if (fileType === 'image' || fileType.startsWith('image/')) return true;
    const url = String(f.fileUrl || f.fileName || '');
    return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  };

  const clientImageUrl = project.files?.find((f: any) => isImageFile(f))?.fileUrl;

  // find latest scheduled inspection report (if any)
  const latestInspectionReport =
  project?.inspectionReports?.length
    ? project.inspectionReports[project.inspectionReports.length - 1]
    : null;

  const scheduledRaw = latestInspectionReport?.inspectionDate || null;
  console.log("LATEST REPORT:", latestInspectionReport);
  console.log("INSPECTION DATE:", latestInspectionReport?.inspectionDate);
  console.log("SCHEDULED RAW:", scheduledRaw);
  console.log("PROJECT:", project);
  const scheduledDateStr = scheduledRaw ? new Date(scheduledRaw).toLocaleDateString('en-GB') : null;
  const scheduledTimeStr = scheduledRaw ? new Date(scheduledRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
  const completedRaw = project?.inspectionCompletedAt || null;
  const completedDateStr = completedRaw ? new Date(completedRaw).toLocaleDateString('en-GB') : '-';
  const completedTimeStr = completedRaw
    ? new Date(completedRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '-';

  const latestApprovedDesign = project.designFiles?.find((d: any) => d?.status === 'APPROVED');
  const selectedDesign = project.files?.find(
  (f: any) =>
    f.meta?.category === "DESIGN" &&
    String(f._id) === String(project.approvedDesignId)
);
  const designConfirmedForApproval = isDesignConfirmedForApproval();

console.log('Selected Design:', selectedDesign);
  const approvedDesignMessages: string[] = [];
  if (project.clientApproved && selectedDesign) {
    approvedDesignMessages.push("Client confirmed Design " + (selectedDesign.meta?.originalName || "Design") + ".");
  }
  if (latestApprovedDesign?.clientComments) {
    approvedDesignMessages.push(`Design approval comment: ${latestApprovedDesign.clientComments}`);
  }
  if (!approvedDesignMessages.length && Array.isArray(project.notes) && project.notes.length) {
    approvedDesignMessages.push(...project.notes);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Image
  src={logoPng}
  alt="Logo"
  width={150}
  height={150}
/>
          <DateTimePickerModal
            open={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            date={scheduleDate}
            time={scheduleTime}
            onDateChange={setScheduleDate}
            onTimeChange={setScheduleTime}
            onSubmit={submitSchedule}
            dateLabel="Select Date"
            timeLabel="Set Time"
            submitLabel="Schedule Visit"
          />

          <DateTimePickerModal
            open={showQuotationModal}
            onClose={() => setShowQuotationModal(false)}
            date={quotationDeadlineDate}
            time={quotationDeadlineTime}
            onDateChange={setQuotationDeadlineDate}
            onTimeChange={setQuotationDeadlineTime}
            dateLabel="Select Deadline Date"
            timeLabel="Set Deadline Time"
            submitLabel="Open Bidding"
            warningNote="After this deadline, contractors cannot submit, edit or delete quotations."
            onSubmit={async () => {
              try {
                const deadline = new Date(`${quotationDeadlineDate}T${quotationDeadlineTime}:00`);

                await projectApi.publish(project._id || project.id, {
                  quotationDeadline: deadline.toISOString(),
                });
                await fetchProject();

                setShowQuotationModal(false);

                setNotification({
                  type: "success",
                  message: "Project published successfully.",
                });
              } catch (error) {
                console.error(error);
                setNotification({
                  type: "error",
                  message: "Failed to publish project.",
                });
              }
            }}
          />
          <Link href="/inspection" className="text-xs font-bold text-gray-500 hover:text-primary flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Inspections
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-8" >
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex gap-4 items-start">
              {clientImageUrl ? (
                <img src={clientImageUrl} alt="client-upload" className="w-44 h-32 rounded-2xl object-cover border" />
              ) : null}
              <div>
                
                <h1 className="text-4xl font-extrabold text-primary">{project.title}</h1>
                <div className="text-sm text-gray-600 mt-1">Project ID: <span className="font-semibold text-gray-800">{project._id || project.id}</span></div>
                <div className="text-sm text-gray-600 mt-1">{project.city} — {project.propertyType}</div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-4">
                  <div>
                    <div className="text-[11px] text-gray-500">Client Name</div>
                    <div className="font-semibold text-gray-800">{project.clientId?.name || '-'}</div>
                  </div>
              
                  <div>
                    <div className="text-[11px] text-gray-500">Phone</div>
                    <div className="font-semibold text-gray-800">{project.clientId?.phone || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Email</div>
                    <div className="font-semibold text-gray-800">{project.clientId?.userId?.email || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Category</div>
                    <div className="font-semibold text-gray-800">{project.category || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Property Type</div>
                    <div className="font-semibold text-gray-800">{project.propertyType || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Property Square Feet</div>
                     <div className="font-semibold text-gray-800">{project.squareFeet || '-'} sq.ft</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Budget</div>
                    <div className="font-semibold text-gray-800">{project.budget ? (typeof project.budget === 'number' ? `₹${project.budget.toLocaleString()}` : project.budget) : '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">City / Address</div>
                    <div className="font-semibold text-gray-800">{project.address || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Created Date</div>
                    <div className="font-semibold text-gray-800">{project.createdAt? new Date(project.createdAt).toLocaleDateString(): '-'}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-gray-500">Current Status</div>
                    <div className="font-semibold text-gray-800">{project.status || '-'}</div>
                  </div>

                  
                </div>
              </div>
            </div>

            <div
  className={`px-6 py-3 rounded-2xl font-bold text-lg ${
    project.inspectorApproved
      ? "bg-green-100 text-green-700"
      : project.clientApproved
      ? "bg-blue-100 text-blue-700"
      : project.status === "PROJECT_PUBLISHED"
      ? "bg-orange-100 text-orange-700"
      : "bg-orange-100 text-orange-700"
  }`}
>
  {project.inspectorApproved ? (
    "✓ PROJECT APPROVED"
  ) : project.clientApproved ? (
    "✓ DESIGN CONFIRMED"
  ) : (
    project.status.replaceAll("_", " ")
  )}
  
</div>
</div>           

{project?.status === "INSPECTION_REJECTED" && (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-2xl font-bold text-red-700">
            ❌ Inspection Rejected
        </h2>

        <p className="mt-3 text-gray-700">
            <strong>Reason:</strong>{" "}
            {project.inspectionRejectedReason || "No reason provided"}
        </p>

        <p className="mt-2 text-sm text-gray-600">
            This project is waiting for the client to review the rejection.
        </p>
    </div>
)}

          {/* Action buttons */}
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {project?.status === "INSPECTION_COMPLETED" ? (

  <div className="md:col-span-3 p-5 rounded-2xl border border-green-200 bg-green-50 shadow-sm flex items-center justify-between">

    <div className="flex items-center gap-4">

      <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
        <CalendarCheck size={30} className="text-green-700" />
      </div>

      <div>
        <div className="text-sm text-gray-500">
          Site Visit
        </div>

        <div className="text-2xl font-bold text-green-700">
          Site Visit Completed
        </div>

        <div className="mt-3 grid grid-cols-2 gap-6">

          <div>
            <div className="text-xs text-gray-500">
              Date
            </div>

            <div className="font-semibold">
              {completedDateStr}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500">
              Time
            </div>

            <div className="font-semibold">
              {completedTimeStr}
            </div>
          </div>

        </div>

      </div>

    </div>

    <div className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
      Completed
    </div>

  </div>

) : project?.status === "INSPECTION_SCHEDULED" ? (
              
              <div className="md:col-span-3 p-5 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Calendar size={28} className="text-green-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Site Visit Management</div>
                    <div className="text-2xl font-bold text-green-700">Site Visit Scheduled</div>
                    <div className="mt-3 grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-[11px] text-gray-500">Date</div>
                        <div className="font-semibold text-gray-800">{scheduledDateStr}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500">Time</div>
                        <div className="font-semibold text-gray-800">{scheduledTimeStr}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-6">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700">Scheduled</div>
                </div>
              </div>
            ) : showScheduleControls ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-150 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Site Visit Management</div>
                  <div className="text-sm font-semibold text-gray-800">Inspection Not Scheduled</div>
                </div>
                <button onClick={handleScheduleVisit} className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm">Schedule Visit</button>
              </div>
              ) : null
}

              {project?.status === "INSPECTION_SCHEDULED" &&
 (!inspectionCompleted || !inspectionEvidenceComplete) ? (
  <div className="bg-white border rounded-2xl p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">
        {inspectionCompleted ? "Missing inspection evidence" : "Complete Inspection"}
      </p>
      <h3 className="font-semibold">
        {inspectionCompleted ? "Upload and save evidence" : "Mark as Complete"}
      </h3>
    </div>

    <button
      onClick={handleMarkComplete}
      className="bg-green-600 text-white px-4 py-2 rounded-lg"
    >
      {inspectionCompleted ? "Save Evidence" : "Complete"}
    </button>
  </div>
) : (
  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-green-600 font-semibold">
        ✓ Inspection Completed
      </p>

      <h3 className="font-bold text-green-700">
        Inspection Finished Successfully
      </h3>
    </div>

    <CheckCircle
      size={40}
      className="text-green-600"
    />
  </div>
)}
              {showScheduleControls && scheduledDateStr ? (
                <div className="p-4 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Calendar size={28} className="text-green-700" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">Reschedule Visit</div>
                      <div className="mt-3 grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-[11px] text-gray-500">Date</div>
                          <div className="font-semibold text-gray-800">{scheduledDateStr}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Time</div>
                          <div className="font-semibold text-gray-800">{scheduledTimeStr}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <button onClick={handleReschedule} className="bg-sky-600 text-white px-3 py-2 rounded hover:bg-sky-700 text-sm">
                      Reschedule
                    </button>
                  </div>
                </div>
              ) : showScheduleControls ? (
                <div className="bg-white p-4 rounded-lg border border-gray-150 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Reschedule Visit</div>
                    <div className="text-sm font-semibold text-gray-800">Choose new slot</div>
                  </div>
                  <button onClick={handleReschedule} className="bg-sky-600 text-white px-3 py-2 rounded hover:bg-sky-700 text-sm">
                    Reschedule
                  </button>
                </div>
              ) : null}
            
          </div>

          {/* Main grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-150">
  <h3 className="text-sm font-bold text-primary">
    Client Requirements
  </h3>

  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">
    {project.description || 'No requirements provided'}
  </p>

  <div className="mt-6">
    <h4 className="text-xm font-bold text-primary">
      Attachments
    </h4>

{clientFiles.length ? (
  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {clientFiles.map((file: any) => (
      <a
        key={file._id}
        href={file.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="group"
      >
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <img
            src={file.fileUrl}
            alt="Attachment"
            className="w-full h-32 object-cover group-hover:scale-105 transition"
          />

          <div className="p-2 text-xs text-gray-600">
            {file.fileType || "IMAGE"}
          </div>
        </div>
      </a>
    ))}
  </div>
) : (
  <p className="text-xs text-gray-500 mt-2">
    No attachments uploaded
  </p>
)}
  </div>
</div>

              <div className="bg-white p-4 rounded-lg border border-gray-150">
                <h3 className="text-sm font-bold text-primary">Inspection Evidence</h3>

                <div className="mt-3">
                  {inspectionCompleted && (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
    <div>
      <p className="font-semibold text-green-700">
        ✓ Inspection Completed Successfully
      </p>

      <p className="mt-1 text-xs text-green-800">
        {editingEvidence
          ? "Editing the submitted report. Save your changes when you are done."
          : "This report is read-only. Unlock it only to correct a wrong upload."}
      </p>
    </div>

    {canEditCompletedEvidence && (
      editingEvidence ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cancelEvidenceEdit}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveEvidenceEdit}
            className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingEvidence(true)}
          className="rounded border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
        >
          Edit Evidence
        </button>
      )
    )}
  </div>
)}
                  <label className="text-xs text-gray-500">Photos</label>
                  <div className="mt-2 flex items-center gap-3">
                    {!inspectionEvidenceLocked && (
  <>
    <input
      id="photo-upload"
      type="file"
      accept="image/*"
      multiple
      onChange={handlePhotoFilesChange}
      className="hidden"
    />

    <label
      htmlFor="photo-upload"
      className="inline-flex items-center gap-2 px-3 py-2 bg-[#7A002C] text-white rounded cursor-pointer text-sm"
    >
      <ImageIcon size={16} />
      Upload Photos
    </label>
  </>
)}
                    {uploading && <div className="text-sm text-gray-500">Uploading...</div>}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {inspectionPhotos.length > 0 ? (
                      inspectionPhotos.map((p: string, i: number) => (
                        <div key={p + i} className="relative w-full h-28 rounded-lg overflow-hidden border bg-gray-50">
                          <img src={p} className="w-full h-full object-cover" alt={`inspection-${i}`} />
                          {!inspectionEvidenceLocked && (
  <button
    onClick={() => removePhoto(p)}
    className="absolute top-1 right-1 bg-white/80 p-1 rounded text-red-600"
  >
    ×
  </button>
)}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-red-600">No inspection photos uploaded</div>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="text-xs text-gray-500">Report PDF</label>
                    <div className="mt-2 flex items-center gap-3">
                      {!inspectionEvidenceLocked && (
  <>
    <input
      id="pdf-upload"
      type="file"
      accept="application/pdf"
      onChange={handlePdfFileChange}
      className="hidden"
    />

    <label
      htmlFor="pdf-upload"
      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded cursor-pointer text-sm"
    >
      <FileText size={16} />
      Upload PDF
    </label>
  </>
)}
                      {inspectionPdf ? (
  <>
    {inspectionPdf && (
  <>
    <a
      href={inspectionPdf}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 text-sm hover:underline"
    >
      View PDF
    </a>

    {!inspectionEvidenceLocked && (
      <button
        onClick={() => {
          if (!window.confirm("Remove the inspection report PDF?")) return;
          setInspectionPdf("");
        }}
        className="px-3 py-2 bg-red-500 text-white rounded text-sm"
      >
        Remove PDF
      </button>
    )}
  </>
)}
  </>
) : (
  <div className="text-xs text-red-600">
    No PDF uploaded
  </div>
)}
                </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="inspection-notes" className="text-xs text-gray-500">Notes & Observations</label>
                    <textarea
  id="inspection-notes"
  value={inspectionNotes}
  onChange={(e) => setInspectionNotes(e.target.value)}
  disabled={inspectionEvidenceLocked}
  rows={6}
  placeholder="Enter site observations..."
  className="mt-2 w-full border rounded p-2 text-sm disabled:bg-gray-100 disabled:text-gray-700"
/>
                  </div>
                </div>
              </div>
            </div>  

            <div className="space-y-4">
             {showApprovalActions && (
<div className="bg-white p-4 rounded-lg border border-gray-150">

    <h3 className="text-sm font-bold text-primary">
        Approval Action
    </h3>

    <div className="mt-3 space-y-3">

        <button
            onClick={handleApproveProject}
            disabled={!designConfirmedForApproval}
            title={!designConfirmedForApproval ? "Client must confirm a design before approval" : "Approve project"}
            className={`w-full py-2 rounded flex items-center justify-center gap-2 ${
              designConfirmedForApproval
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
            <CheckCircle />
            Approve Project
        </button>

        {!designConfirmedForApproval && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Approval unlocks after the client confirms a design.
          </p>
        )}


        <button
            onClick={handleRejectInspection}
            className="w-full bg-red-600 text-white py-2 rounded flex items-center justify-center gap-2"
        >
            <XCircle />
            Reject Inspection
        </button>

    </div>

</div>
)}

              
  {designConfirmedForApproval && (
  <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">

    <h4 className="text-base font-bold text-[#6B0F2D] mb-1">
      Bill of Quantity
    </h4>

    <p className="text-sm text-gray-500 mb-3">
      Upload a revised BOQ. Contractors see the latest version on the bidding screen.
    </p>

    <input
      id="boq-upload"
      type="file"
      accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      onChange={handleBoqFileChange}
      className="hidden"
    />

    <label
      htmlFor="boq-upload"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm text-white ${
        uploadingBoq ? "bg-gray-400 pointer-events-none" : "bg-[#6B0F2D] cursor-pointer"
      }`}
    >
      <FileText size={16} />
      {uploadingBoq
        ? "Working..."
        : latestExcelBoq
          ? "Reupload BOQ (Excel)"
          : "Upload BOQ (Excel)"}
    </label>

    {latestExcelBoq ? (
      <p className="mt-3 text-sm text-green-700">
        ✓ {latestExcelBoq.meta?.originalName || latestExcelBoq.fileName} — shared with contractors
        {latestExcelBoq.createdAt
          ? ` on ${new Date(latestExcelBoq.createdAt).toLocaleDateString()}`
          : ""}
        {" "}
        <a
          href={latestExcelBoq.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#6B0F2D] hover:underline"
        >
          View
        </a>
      </p>
    ) : (
      <p className="mt-3 text-sm text-gray-500">
        No BOQ uploaded yet.
      </p>
    )}

  </div>
  )}

  {(designFiles.length > 0 || boqFiles.length > 0) ? (
  <div className="space-y-6">

    <div>
      <h4 className="text-base font-bold text-[#6B0F2D] mb-3">
        Client Approved
      </h4>

      <div className="space-y-3">

        {[
          {
            label: "Design",
            file: approvedDesignFile || designFiles[0],
            files: designFiles,
            approved: !!approvedDesignFile,
          },
          {
            label: "BOQ",
            file: approvedBoqFile || boqFiles[0],
            files: boqFiles,
            approved: !!approvedBoqFile,
          },
        ].map(({ label, file, files, approved }) => (
          <div
            key={label}
            className={`flex items-center justify-between rounded-xl border p-4 ${
              approved ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
            }`}
          >
            <div className="min-w-0 flex-1 pr-4">
              <div className="font-semibold text-gray-900 truncate">
                {label} {file ? versionLabel(files, file) : ""}
              </div>

              <div className="text-sm text-gray-500 truncate">
                {file
                  ? file.meta?.originalName || file.fileName
                  : `No ${label} shared with the client yet`}
              </div>

              {file && (
                approved ? (
                  <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    ✓ Approved by Client
                  </span>
                ) : (
                  <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    Shared — awaiting client approval
                  </span>
                )
              )}
            </div>

            {file && (
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 flex-shrink-0 text-center py-2 bg-[#6B0F2D] text-white rounded-lg"
              >
                View
              </a>
            )}
          </div>
        ))}

      </div>
    </div>

    <div>
      <h4 className="text-base font-bold text-[#6B0F2D] mb-3">
        Design Versions
      </h4>

      <div className="space-y-3">

        {designFiles.map((file: any, index: number) => {

    const versionNumber = designFiles.length - index;

    const isApproved =
        String(file._id) === String(project.approvedDesignId);

    return (

        <div
            key={file._id}
            className={`flex items-center justify-between rounded-xl border p-4 transition ${
                isApproved
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
            }`}
        >

            <div className="min-w-0 flex-1 pr-4">

                <div className="font-semibold text-gray-900 truncate">
                    🏠 Design Version {versionNumber}
                </div>

                <div className="text-sm text-gray-500 truncate">
                    {file.meta?.originalName || file.fileName}
                </div>

                {isApproved && (
                    <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        ✓ Approved by Client
                    </span>
                )}

            </div>

            <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 flex-shrink-0 text-center py-2 bg-[#6B0F2D] text-white rounded-lg"
            >
                View
            </a>

        </div>

    );

})}

      </div>

    </div>

    {boqFiles.length > 0 && (
      <div>
        <h4 className="text-base font-bold text-[#6B0F2D] mb-3">
          BOQ Versions
        </h4>

        <div className="space-y-3">

          {boqFiles.map((file: any, index: number) => {

            const versionNumber = boqFiles.length - index;

            const isApproved =
              String(file._id) === String(project?.selectedBoqId);

            return (
              <div
                key={file._id}
                className={`flex items-center justify-between rounded-xl border p-4 transition ${
                  isApproved
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="font-semibold text-gray-900 truncate">
                    📄 BOQ Version {versionNumber}
                  </div>

                  <div className="text-sm text-gray-500 truncate">
                    {file.meta?.originalName || file.fileName}
                  </div>

                  {isApproved && (
                    <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      ✓ Approved by Client
                    </span>
                  )}
                </div>

                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-24 flex-shrink-0 text-center py-2 bg-[#6B0F2D] text-white rounded-lg"
                >
                  View
                </a>
              </div>
            );
          })}

        </div>
      </div>
    )}

  </div>
) : (
  <div className="text-center py-10">

    <p className="text-gray-500">
      No Design has been uploaded yet.
    </p>

  </div>
)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
