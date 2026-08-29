import { Response } from 'express';
import { Message } from "../models/Message";
import ProjectService from "../services/project.service";
import { DesignPackage } from "../models/DesignPackage";
import { ProjectFile } from "../models/ProjectFile";
import { getQuotationClosedMessage, isQuotationSubmissionOpen } from '../utils/quotationWorkflow';

// Local enum definitions (stand-ins for @prisma/client enums) to allow
// compilation while migrating from Prisma to Mongoose.
export enum Role {
  CLIENT = 'CLIENT',
  CONTRACTOR = 'CONTRACTOR',
  INSPECTION_TEAM = 'INSPECTION_TEAM',
  ADMIN = 'ADMIN',
}

export enum ProjectStatus {
  PROJECT_POSTED = 'PROJECT_POSTED',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  DESIGN_CREATION = 'DESIGN_CREATION',
  INSPECTION_REJECTED = 'INSPECTION_REJECTED',
  DESIGN_REVIEW = 'DESIGN_REVIEW',
  DESIGN_SUBMITTED = 'DESIGN_SUBMITTED',
  CLIENT_REVIEW = 'CLIENT_REVIEW',
  DESIGN_APPROVED = 'DESIGN_APPROVED',
  PROJECT_PUBLISHED = 'PROJECT_PUBLISHED',
  BIDDING_OPEN = 'BIDDING_OPEN',
  QUOTATION_SUBMITTED = 'QUOTATION_SUBMITTED',
  QUOTATION_VERIFIED = 'QUOTATION_VERIFIED',
  CLIENT_COMPARISON = 'CLIENT_COMPARISON',
  CONTRACTOR_SELECTED = 'CONTRACTOR_SELECTED',
  CONTRACTOR_CONFIRMED = 'CONTRACTOR_CONFIRMED',
  WORK_STARTED = 'WORK_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETION_VERIFICATION = 'COMPLETION_VERIFICATION',
  READY_FOR_HANDOVER = 'READY_FOR_HANDOVER',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  CANCELLED = 'CANCELLED',
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export enum ReviewStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum ContractorStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum ReportType {
  VISIT = 'VISIT',
  QUALITY = 'QUALITY',
  ISSUE = 'ISSUE',
}
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendEmail, APP_URL } from '../config/mailer';
import logger from '../utils/logger';
import { getIO, broadcastDataChanged } from '../utils/socket';
import { shouldHideBoq, redactBoqFiles } from '../utils/boqAccess';
import {
  Project,
  InspectionReport,
  DesignFile,
  Quotation,
  ProjectUpdate,
  SiteVisitReport,
  QuotationDraft,
  Review,
  Dispute,
  AuditLog,
  Client,
  Contractor,
  User,
} from '../models';

const INSPECTION_WORKFLOW_PROJECT_STATUSES = [
  ProjectStatus.PENDING_INSPECTION,
  ProjectStatus.INSPECTION_SCHEDULED,
  ProjectStatus.INSPECTION_COMPLETED,
  ProjectStatus.PROJECT_PUBLISHED,
  ProjectStatus.DESIGN_CREATION,
  ProjectStatus.DESIGN_REVIEW,
  ProjectStatus.DESIGN_APPROVED,
  ProjectStatus.CLIENT_COMPARISON,
  ProjectStatus.BIDDING_OPEN,
  ProjectStatus.CONTRACTOR_SELECTED,

  // ADD THIS LINE
  ProjectStatus.CONTRACTOR_CONFIRMED,

  ProjectStatus.WORK_STARTED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETION_VERIFICATION,
];

const APPROVED_OR_ACTIVE_PROJECT_STATUSES = [
  ProjectStatus.CONTRACTOR_SELECTED,
  ProjectStatus.CONTRACTOR_CONFIRMED,
  ProjectStatus.WORK_STARTED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETION_VERIFICATION,
  ProjectStatus.PROJECT_PUBLISHED,
  ProjectStatus.BIDDING_OPEN,
  ProjectStatus.CLIENT_COMPARISON,
];

// CREATE PROJECT (Client only)
export async function createProject(req: AuthenticatedRequest, res: Response) {
  const { title, category, description, propertyType, squareFeet, budget, address, city, photos } = req.body;
  const clientId = req.user?.clientId;

  if (!clientId) return res.status(403).json({ error: 'Client profile not found' });
  if (!title || !description || !propertyType || !squareFeet || !budget || !address || !city) return res.status(400).json({ error: 'Missing required project fields' });
  if (!Array.isArray(photos) || photos.length === 0) return res.status(400).json({ error: 'At least one project photo is required' });

  try {
    const project = await Project.create({
      clientId: new mongoose.Types.ObjectId(clientId),
      title,
      category,
      description,
      propertyType,
      squareFeet: parseInt(squareFeet, 10),
      budget: parseFloat(budget),
      address,
      city,
      status: ProjectStatus.PENDING_INSPECTION as any,
    });

    if (photos && Array.isArray(photos) && photos.length) {
      await ProjectFile.insertMany(photos.map((url: string) => ({ projectId: project._id, fileUrl: url, fileType: FileType.IMAGE, uploadedBy: 'CLIENT' })));
    }

    await AuditLog.create({ action: 'PROJECT_CREATED', details: `Project "${title}" created by client ${clientId}`, userId: req.user?.id });

    broadcastDataChanged(['projects']);
    return res.status(201).json(project);
  } catch (error) {
    // Log full error including stack for local debugging
    logger.error('Create project error', { message: (error as any)?.message, stack: (error as any)?.stack });
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: 'Internal server error', details: (error as any)?.message, stack: (error as any)?.stack });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET ALL PROJECTS
export async function getProjects(req: AuthenticatedRequest, res: Response) {
  const role = req.user?.role;
  const clientId = req.user?.clientId;
  const contractorId = req.user?.contractorId;
  const inspectionTeamId = req.user?.inspectionTeamId;

  try {
    let filter: any = {};
    if (role === Role.CLIENT && clientId) filter.clientId = new mongoose.Types.ObjectId(clientId);
    if (role === Role.CONTRACTOR) {
      filter = {
        $or: [
          {
            status: {
              $in: [
                ProjectStatus.PROJECT_PUBLISHED,
                ProjectStatus.BIDDING_OPEN,
                ProjectStatus.CLIENT_COMPARISON,
              ],
            },
          },
          {
            contractorId: contractorId
              ? new mongoose.Types.ObjectId(contractorId)
              : null,
          },
        ],
      };
    }
    if (role === Role.INSPECTION_TEAM) filter = {
      $or: [
        { assignedInspectorId: inspectionTeamId ? new mongoose.Types.ObjectId(inspectionTeamId) : null },
        { status: { $in: INSPECTION_WORKFLOW_PROJECT_STATUSES } }
      ]
    };
    console.log("FILTER USED:");
console.log(JSON.stringify(filter, null, 2));

    let query: any = Project.find(filter)
  .populate('clientId')
  .populate('contractorId')
  .populate('assignedInspectorId')
  .sort({ createdAt: -1 });

    const projects = await query.lean().exec();

console.log("TOTAL PROJECTS:", projects.length);

projects.forEach((p: any) => {
    console.log(
        p.title,
        p.status,
        p.assignedInspectorId
    );
});
    console.log("========== DATABASE PROJECTS ==========");

projects.forEach((p: any) => {
    console.log({
        title: p.title,
        status: p.status,
        clientId: p.clientId,
        assignedInspectorId: p.assignedInspectorId,
    });
});

const result = await Promise.all(
  projects.map(async (project: any) => {

    const client: any = project.clientId;

    const design = await DesignFile.findOne({
      projectId: project._id,
    }).lean();

    const inspection = await InspectionReport.findOne({
      projectId: project._id,
    }).lean();

console.log("================================");
console.log("PROJECT:", project.title);
console.log("PROJECT ID:", project._id.toString());
console.log("INSPECTION:", inspection);
console.log("================================");

    let myQuotation = null;

if (contractorId) {
    myQuotation = await Quotation.findOne({
        projectId: project._id,
        contractorId: new mongoose.Types.ObjectId(contractorId),
    }).lean();
}

    // Bidding has genuinely stalled — deadline passed with no usable (verified,
    // non-declined) quotation left — and needs an inspector to reopen it with a
    // fresh date/time, rather than the system silently picking one.
    let needsBiddingReopen = false;
    if (
      [ProjectStatus.PROJECT_PUBLISHED, ProjectStatus.BIDDING_OPEN, ProjectStatus.CLIENT_COMPARISON].includes(
        project.status
      ) &&
      project.quotationDeadline &&
      new Date(project.quotationDeadline).getTime() < Date.now()
    ) {
      const usableQuotationCount = await Quotation.countDocuments({
        projectId: project._id,
        isVerified: true,
        contractorDeclined: { $ne: true },
      });
      needsBiddingReopen = usableQuotationCount === 0;
    }

return {
    ...project,

    clientName: project.clientId?.name || "Unknown",

    design: !!design,

    inspectionCompleted:
        inspection &&
        ["COMPLETED", "SUBMITTED", "APPROVED"].includes(
            (inspection as any).inspectionStatus
        ),

    hasSubmittedQuotation: !!myQuotation,

    quotationRejected: myQuotation?.rejected || false,

    // Contractor was selected but declined before confirming — distinct from
    // the inspector rejecting the quotation itself.
    contractorDeclinedProject: myQuotation?.contractorDeclined || false,

    requoteRequested: myQuotation?.requoteRequested || false,

    quotationVerified: myQuotation?.isVerified || false,

    needsBiddingReopen,

    myQuotation,
};
  })
);

console.log("========== FINAL PROJECTS ==========");

result.forEach((p: any) => {
  console.log({
    title: p.title,
    status: p.status,
    contractorId: p.contractorId,
    currentContractor: contractorId,
  });
});

return res.json(result);
  } catch (error) {
    logger.error('Get projects error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET Approved / Assigned Projects (role-aware)
export async function getApprovedProjects(req: AuthenticatedRequest, res: Response) {
  const role = req.user?.role;
  const contractorId = req.user?.contractorId;
  const clientId = req.user?.clientId;
  const inspectionTeamId = req.user?.inspectionTeamId;

  try {
    const approvedStatuses = APPROVED_OR_ACTIVE_PROJECT_STATUSES;

    let filter: any = {};

    if (role === Role.CONTRACTOR) {
      if (!contractorId) return res.status(403).json({ error: 'Contractor profile not found' });

      // Find projects where contractor is assigned OR where this contractor had a selected quotation
      const selectedQuotes = await Quotation.find({ contractorId: contractorId, selected: true }).lean().exec();
      const projectIds = (selectedQuotes || []).map((q: any) => q.projectId).filter(Boolean);

      filter = {
        $or: [
          { contractorId: new mongoose.Types.ObjectId(contractorId) },
          { _id: { $in: projectIds.map((id: any) => new mongoose.Types.ObjectId(id)) } },
          { status: { $in: approvedStatuses } },
        ],
      };
    } else if (role === Role.CLIENT) {
      if (!clientId) return res.status(403).json({ error: 'Client profile not found' });
      filter = { clientId: new mongoose.Types.ObjectId(clientId), status: { $in: approvedStatuses } };
    } else if (role === Role.INSPECTION_TEAM) {
      filter = { $or: [{ assignedInspectorId: inspectionTeamId ? new mongoose.Types.ObjectId(inspectionTeamId) : null }, { status: { $in: approvedStatuses } }] };
    } else {
      // Admin or others: return all projects with approved statuses
      filter = { status: { $in: approvedStatuses } };
    }

    const query: any = Project.find(filter).sort({ createdAt: -1 });
    const projects = await query.lean().exec();
    return res.json(projects);
  } catch (error) {
    logger.error('getApprovedProjects error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET SINGLE PROJECT BY ID
export async function getProjectById(req: AuthenticatedRequest, res: Response) {
  console.log("GET PROJECT BY ID CALLED");
  const { id } = req.params;
  const role = req.user?.role;
  const contractorId = req.user?.contractorId;

  try {
    const project = await Project.findById(id).populate({ path: 'clientId', populate: { path: 'userId', model: 'User', select: 'email name phone address' } }).populate('contractorId').populate('assignedInspectorId').lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [
  files,
  inspectionReports,
  quotations,
  updates,
  siteVisitReports,
  disputes,
  reviews,
] = await Promise.all([
  ProjectFile.find({ projectId: project._id }).lean().exec(),
  InspectionReport.find({ projectId: project._id }).sort({ createdAt: 1 }).lean().exec(),
  Quotation.find({ projectId: project._id }).populate("contractorId").lean().exec(),
  ProjectUpdate.find({ projectId: project._id }).sort({ createdAt: -1 }).lean().exec(),
  SiteVisitReport.find({ projectId: project._id }).sort({ createdAt: -1 }).lean().exec(),
  Dispute.find({ projectId: project._id }).lean().exec(),
  Review.find({ projectId: project._id }).lean().exec(),
]);
let myQuotation = null;

if (contractorId) {
  myQuotation = await Quotation.findOne({
    projectId: project._id,
    contractorId: new mongoose.Types.ObjectId(contractorId),
  }).lean();
}

const selectedQuotationDetails = project.selectedQuotation
  ? await Quotation.findById(project.selectedQuotation)
      .populate("contractorId")
      .lean()
      .exec()
  : await Quotation.findOne({
      projectId: project._id,
      selected: true,
    })
      .populate("contractorId")
      .lean()
      .exec();
const selectedContractorId = (selectedQuotationDetails as any)?.contractorId || project.selectedContractor || project.contractorId;
const activeQuotationDraft: any = selectedContractorId
  ? await QuotationDraft.findOne({ projectId: project._id, contractorId: selectedContractorId }).lean().exec()
  : null;
const hasDraftBreakdown = activeQuotationDraft && [
  activeQuotationDraft.labourCost,
  activeQuotationDraft.electricalCost,
  activeQuotationDraft.plumbingCost,
  activeQuotationDraft.falseCeilingCost,
  activeQuotationDraft.paintingCost,
  activeQuotationDraft.grandTotal,
  ...(Array.isArray(activeQuotationDraft.materials) ? activeQuotationDraft.materials.map((item: any) => item.amount) : []),
].some((value) => Number(value || 0) > 0);
const inspectorQuotation = selectedQuotationDetails;

const designFiles = files
  .filter((file: any) => file.meta?.category === "DESIGN")
  .sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

const boqFiles = files
  .filter((file: any) => file.meta?.category === "BOQ")
  .sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

const hideBoq = await shouldHideBoq(project._id, req.user?.role);
const visibleBoqFiles = hideBoq ? redactBoqFiles(boqFiles) : boqFiles;

const approvedDesign = await ProjectFile.findById(project.approvedDesignId).lean();
const latestInspectionReport =
  inspectionReports.length > 0
    ? inspectionReports[inspectionReports.length - 1]
    : null;
console.log("========== LATEST INSPECTION ==========");
console.log(JSON.stringify(latestInspectionReport, null, 2));
const inspectionPhotos =
  (latestInspectionReport as any)?.photos?.length
    ? (latestInspectionReport as any).photos
    : (project as any).inspectionPhotos || [];

const inspectionReportPdf =
  (latestInspectionReport as any)?.documents?.[0] ||
  (project as any).inspectionReportPdf ||
  null;

const inspectionNotes =
  (latestInspectionReport as any)?.notes ||
  (latestInspectionReport as any)?.remarks ||
  (project as any).inspectionNotes ||
  "";
console.log("approvedDesignId:", project.approvedDesignId);
const sampleFiles = await ProjectFile.find().limit(5).lean();
console.log("Sample Project Files:", sampleFiles);

console.log("approvedDesign:", approvedDesign);

    const fullProject: any = {
  ...project,

  contractor:
  (selectedQuotationDetails as any)?.contractorId ||
  (project as any).contractorId ||
  null,

  clientName: (project as any).clientId?.name || "Unknown",

  inspectionCompleted:
!!inspectionReportPdf &&
!!inspectionNotes,

  designCompleted: designFiles.length > 0,

  files,

  inspectionReports,

  inspectionReport: latestInspectionReport,

  designFiles,

  boqFiles: visibleBoqFiles,

  boqUnlocked: !!project.boqUnlocked,

  inspectionPhotos,

  inspectionReportPdf,

  inspectionNotes,

  approvedDesign,

  approvedDesignId: project.approvedDesignId,

  quotations,

  selectedQuotationDetails: inspectorQuotation,

  updates,

  siteVisitReports,

  disputes,

  reviews,
  myQuotation,
hasSubmittedQuotation: !!myQuotation,
requoteRequested: (myQuotation as any)?.requoteRequested || false,
};

    const isAssignedContractor = String((project as any).contractorId?._id || project.contractorId || '') === String(contractorId || '');
    const isBiddingStatus = [ProjectStatus.PROJECT_PUBLISHED, ProjectStatus.BIDDING_OPEN, ProjectStatus.CLIENT_COMPARISON].includes(project.status as any);

    if (role === Role.CONTRACTOR && !isAssignedContractor && !isBiddingStatus) {
      return res.status(403).json({ error: 'Quotation is closed. Another contractor has already been selected.' });
    }

    if (role === Role.CONTRACTOR && !isAssignedContractor && isBiddingStatus) {
      const maskedProject = {
        ...fullProject,
        clientId: { name: 'Homeowner (Details hidden)', phone: 'Hidden', address: 'Hidden', city: project.city },
        quotations: (quotations as any[]).filter((q: any) => String(q.contractorId?._id || q.contractorId) === String(contractorId)),
      };
      return res.json(maskedProject);
    }

    // The client's contact details are released to the contractor only once
    // they have actually won and accepted the job — never during bidding.
    const ACCEPTED_STATUSES = [
      'CONTRACTOR_CONFIRMED',
      'WORK_STARTED',
      'IN_PROGRESS',
      'COMPLETION_VERIFICATION',
      'READY_FOR_HANDOVER',
      'PROJECT_COMPLETED',
    ];

    if (
      role === Role.CONTRACTOR &&
      isAssignedContractor &&
      ACCEPTED_STATUSES.includes(String(project.status))
    ) {
      const clientRecordId = (project as any).clientId?._id || project.clientId;
      const clientRecord: any = await Client.findById(clientRecordId).lean().exec();
      const clientUser: any = clientRecord
        ? await User.findById(clientRecord.userId).select('email').lean().exec()
        : null;

      fullProject.clientContact = {
        name: clientRecord?.name || '',
        phone: clientRecord?.phone || '',
        email: clientUser?.email || '',
      };
    }

    console.log("========== FINAL RESPONSE ==========");
console.log(fullProject.inspectionReport);
console.log(fullProject.inspectionReports);
console.log(fullProject.inspectionPhotos);
console.log(fullProject.inspectionReportPdf);
console.log(fullProject.inspectionNotes);

    return res.json(fullProject);
    
  } catch (error) {
    logger.error('Get project detail error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ASSIGN INSPECTION TEAM (Admin only)
export async function assignInspector(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { inspectorId } = req.body;

  try {
    const updated = await Project.findByIdAndUpdate(id, { assignedInspectorId: inspectorId ? new mongoose.Types.ObjectId(inspectorId) : undefined, status: ProjectStatus.PENDING_INSPECTION as any }, { new: true }).lean().exec();
    await AuditLog.create({ action: 'INSPECTION_TEAM_ASSIGNED', details: `InspectionTeam ${inspectorId} assigned to project ${id}`, userId: req.user?.id });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// SCHEDULE SITE INSPECTION (Inspector only)
export async function scheduleInspection(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { scheduledDate } = req.body;
  const inspectionTeamId = req.user?.inspectionTeamId;

  if (!inspectionTeamId) return res.status(403).json({ error: 'Inspection team profile not found' });

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const completionTimestamp = project.inspectionCompletedAt || new Date();

    // A prior SCHEDULED report means this call is a reschedule, not a first
    // booking — captured before the new report is created so the client can
    // be shown what actually changed.
    const previousReport = await InspectionReport.findOne({
      projectId: project._id,
      inspectionStatus: 'SCHEDULED',
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const isReschedule = !!previousReport?.inspectionDate;

    const report = await InspectionReport.create({
  projectId: project._id,
  inspectionTeamId: new mongoose.Types.ObjectId(inspectionTeamId),
  inspectionDate: new Date(scheduledDate),
  inspectionStatus: 'SCHEDULED'
});
    const updatedProject = await Project.findByIdAndUpdate(id, { status: ProjectStatus.INSPECTION_SCHEDULED as any }, { new: true }).lean().exec();

    const client = await Client.findById(project.clientId).lean().exec();
    const user = client ? await User.findById((client as any).userId).lean().exec() : null;
    const userEmail = (user as any)?.email;
    if (userEmail) {
      const start = new Date(scheduledDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour visit window
      const formatDate = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      const formatTime = (d: Date) =>
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const baseContext = {
        clientName: (client as any)?.name || 'Client',
        projectTitle: project.title || '',
        projectAddress: [project.address, project.city].filter(Boolean).join(', ') || 'your registered site address',
        inspectorName: req.user?.email || 'Inspection Team',
        viewProjectUrl: `${APP_URL}/client/my-projects/${project._id}`,
      };

      if (isReschedule) {
        const prevDate = new Date(previousReport!.inspectionDate!);
        await sendEmail({
          to: userEmail,
          templateType: 'INSPECTION_RESCHEDULED',
          context: {
            ...baseContext,
            previousDate: formatDate(prevDate),
            previousTime: formatTime(prevDate),
            scheduledDate: formatDate(start),
            startTime: formatTime(start),
            endTime: formatTime(end),
          },
        });
      } else {
        await sendEmail({
          to: userEmail,
          templateType: 'INSPECTION_SCHEDULED',
          context: {
            ...baseContext,
            scheduledDate: formatDate(start),
            startTime: formatTime(start),
            endTime: formatTime(end),
          },
        });
      }
    }

    broadcastDataChanged(['projects', 'inspections']);
    return res.json({ updatedProject, report });
  } catch (error) {
    logger.error('scheduleInspection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// COMPLETE INSPECTION & UPLOAD MEASUREMENTS (Inspector only)
export async function submitInspectionReport(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const {
    measurements,
    notes,
    remarks,
    reportFileUrl,
    documents,
    reportId,
    photos,
    inspectionDate,
  } = req.body;
  const inspectionNotes = notes || remarks || "";
  const inspectionPdf = reportFileUrl || documents?.[0] || "";
console.log("===== submitInspectionReport =====");
console.log("Project ID:", id);
console.log("========== REPORT ==========");
console.log("Project ID:", id);

console.log("Report ID:", reportId);

console.log("Photos:", photos);

console.log("PDF:", inspectionPdf);

console.log("Notes:", inspectionNotes);

  try {
    const project = await Project.findById(id).exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const completionTimestamp = project.inspectionCompletedAt || new Date();

    const reportUpdate = {
      inspectionStatus: "SUBMITTED",
      submittedAt: new Date(),
      inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
      report: measurements || {},
      remarks: inspectionNotes,
      photos: photos || [],
      documents: inspectionPdf ? [inspectionPdf] : [],
    };

    const report = reportId
      ? await InspectionReport.findOneAndUpdate(
          { _id: reportId, projectId: project._id },
          reportUpdate,
          { new: true }
        )
      : await InspectionReport.findOneAndUpdate(
          { projectId: project._id },
          reportUpdate,
          { new: true, sort: { createdAt: -1 } }
        );

    // A project can be completed without first scheduling a visit.
    if (!report) {
      await InspectionReport.create({
        projectId: project._id,
        inspectionTeamId: req.user?.inspectionTeamId,
        ...reportUpdate,
      });
    }

    project.status = ProjectStatus.INSPECTION_COMPLETED as any;
    project.inspectionCompletedAt = completionTimestamp;
    project.inspectionPhotos = photos || [];
    project.inspectionReportPdf = inspectionPdf;
    project.inspectionNotes = inspectionNotes;

    console.log("Before Save:", project.inspectionCompletedAt);
    await project.save();
    console.log("After Save:", project.inspectionCompletedAt);

    const updatedProject = project.toObject();

    const client = await Client.findById(project.clientId).lean().exec();
    const user = client ? await User.findById((client as any).userId).lean().exec() : null;
    const userEmail = (user as any)?.email;
    if (userEmail) {
      await sendEmail({
        to: userEmail,
        templateType: 'INSPECTION_COMPLETED',
        context: {
          clientName: (client as any)?.name || 'Client',
          projectTitle: project.title || '',
          inspectionDate: new Date(reportUpdate.inspectionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
          projectAddress: [project.address, project.city].filter(Boolean).join(', ') || 'your registered site address',
          viewProjectUrl: `${APP_URL}/client/my-projects/${project._id}`,
        },
      });
    }

    broadcastDataChanged(['projects', 'inspections']);
    return res.json(updatedProject);
  } catch (error) {
    logger.error('submitInspectionReport', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// UPLOAD DESIGN FILES (Inspector only)
export async function uploadDesign(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { fileUrl } = req.body;

  try {
    const design = await DesignFile.create({
      projectId: id,
      fileUrl,
      status: ReviewStatus.PENDING_REVIEW as any
    });
    await DesignPackage.findOneAndUpdate(
  { projectId: id },
  {
    $push: {
      designFiles: design._id,
    },
  },
  {
    upsert: true,
    new: true,
  }
);

console.log("Design linked to design package");

    await Message.create({
      conversationId: id,
      from: req.user?.id,
      content: "🖼 Design Uploaded",
      attachments: [
        {
          type: "design",
          url: fileUrl,
          name: "Design"
        }
      ]
    });

    const project = await Project.findByIdAndUpdate(
      id,
      { status: ProjectStatus.DESIGN_CREATION as any },
      { new: true }
    ).lean().exec();

    broadcastDataChanged(['projects', 'designs']);
    return res.json({ project, design });

  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

// CLIENT REVIEW OF DESIGN (Client only)
export async function reviewDesign(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { approve, comments } = req.body;

  try {
    const latestDesign = await DesignFile.findOne({ projectId: id }).sort({ createdAt: -1 }).lean().exec();
    if (!latestDesign) return res.status(400).json({ error: 'Design must exist before reviewing' });

    if (approve) {
      await DesignFile.findByIdAndUpdate(latestDesign._id, { status: ReviewStatus.APPROVED as any, clientComments: comments }).exec();
      const project = await Project.findByIdAndUpdate(id, { status: ProjectStatus.DESIGN_APPROVED as any }, { new: true }).lean().exec();
      broadcastDataChanged(['projects', 'designs']);
      return res.json(project);
    }

    await DesignFile.findByIdAndUpdate(latestDesign._id, { status: ReviewStatus.REVISION_REQUESTED as any, clientComments: comments }).exec();
    const project = await Project.findByIdAndUpdate(id, { status: ProjectStatus.DESIGN_CREATION as any }, { new: true }).lean().exec();
    broadcastDataChanged(['projects', 'designs']);
    return res.json(project);
  } catch (error) {
    logger.error('reviewDesign', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CLIENT CONFIRM SELECTED DESIGN
export async function clientConfirmSelection(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params;
    const { selectedDesignId } = req.body;

    if (!selectedDesignId) {
      return res.status(400).json({ error: 'Please select a Design.' });
    }

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.selectedDesignId = selectedDesignId as any;
    project.clientApproved = true;
    project.clientApprovedAt = new Date();
    project.status = ProjectStatus.DESIGN_APPROVED as any;

    await project.save();

    broadcastDataChanged(['projects', 'designs']);
    return res.json({ success: true, message: 'Selection confirmed successfully.', project });
  } catch (error) {
    logger.error('clientConfirmSelection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
// SUBMIT QUOTATION (Contractor only)
export async function submitQuotation(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const {
    cost,
    grandTotal,
    timeline,
    description,
    labourCost,
    electricalCost,
    plumbingCost,
    falseCeilingCost,
    paintingCost,
    materials,
    extraCharges,
    quotationExcel,
    quotationPdf,
    quotationFileUrl,
  } = req.body;
  const contractorId = req.user?.contractorId;

  if (!contractorId) return res.status(403).json({ error: 'Contractor profile not found' });

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!isQuotationSubmissionOpen(project.status)) {
      return res.status(400).json({ error: getQuotationClosedMessage() });
    }

    const contractor = await Contractor.findById(contractorId).lean().exec();
    if (!contractor || (contractor as any).status !== ContractorStatus.VERIFIED) return res.status(403).json({ error: 'Only verified contractors can place quotations' });

    const existingQuotation = await Quotation.findOne({
  projectId: id,
  contractorId: new mongoose.Types.ObjectId(contractorId),
});

// A re-quote request is the one case where re-submitting is allowed: the
// inspector asked for revised figures, so the existing quotation is replaced.
if (existingQuotation && !existingQuotation.requoteRequested) {
  return res.status(400).json({
    error: "You have already submitted a quotation for this project."
  });
}

const draft = await QuotationDraft.findOne({
  projectId: id,
  contractorId: new mongoose.Types.ObjectId(contractorId),
});

if (!draft && grandTotal == null && cost == null) {
  return res.status(400).json({ error: "Quotation details are required." });
}

const quotationValues = {
  labourCost: labourCost ?? draft?.labourCost ?? 0,
  electricalCost: electricalCost ?? draft?.electricalCost ?? 0,
  plumbingCost: plumbingCost ?? draft?.plumbingCost ?? 0,
  falseCeilingCost: falseCeilingCost ?? draft?.falseCeilingCost ?? 0,
  paintingCost: paintingCost ?? draft?.paintingCost ?? 0,
  materials: materials ?? draft?.materials ?? [],
  extraCharges: extraCharges ?? draft?.extraCharges ?? [],
  grandTotal: grandTotal ?? cost ?? draft?.grandTotal ?? 0,
  quotationExcel: quotationExcel ?? draft?.quotationExcel ?? quotationFileUrl ?? "",
  quotationPdf: quotationPdf ?? draft?.quotationPdf ?? "",
};

// The inspection team reviews the quotation sheet, so a bid without one is
// incomplete and cannot be accepted.
if (!quotationValues.quotationExcel) {
  return res.status(400).json({ error: "Quotation attachment (Excel) is required." });
}

  const quotationPayload = {
  projectId: project._id,
  contractorId: new mongoose.Types.ObjectId(contractorId),

  ...quotationValues,

  cost: quotationValues.grandTotal,

  message: description,
  timelineDays: timeline,
  validityDays: 7,

  isVerified: false,
  rejected: false,
  requoteRequested: false,

  // Preserve the fact that this replaced an earlier quotation the inspector
  // sent back, so the verification screens can label it as a re-quote.
  requoted: existingQuotation?.requoteRequested === true || existingQuotation?.requoted === true,

  selected: false,
};

  const quotation = existingQuotation
  ? await Quotation.findByIdAndUpdate(existingQuotation._id, quotationPayload, { new: true }).exec() as any
  : await Quotation.create(quotationPayload);
console.log("========== QUOTATION SAVED ==========");
console.log(quotation);
console.log("Saved contractorId:", quotation.contractorId);
console.log("Logged in contractorId:", contractorId);
console.log("=====================================");

await QuotationDraft.deleteOne({
  projectId: project._id,
  contractorId: new mongoose.Types.ObjectId(contractorId),
});

    await Project.findByIdAndUpdate(id, { status: ProjectStatus.BIDDING_OPEN as any }).exec();
    await AuditLog.create({ action: 'QUOTATION_SUBMITTED', details: `Contractor ${contractorId} submitted quotation of ${cost} for project ${id}`, userId: req.user?.id });

    broadcastDataChanged(['quotations', 'projects']);
    return res.status(201).json(quotation);
  } catch (error) {
    logger.error('submitQuotation', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// VERIFY CONTRACTOR QUOTATION (Inspector/Admin only)
export async function verifyQuotation(req: AuthenticatedRequest, res: Response) {
  const { id, quoteId } = req.params;

  try {
    const { remarks, constrobidQuotation, constrobidQuotationName } = req.body;

    // The client only ever sees the ConstroBID quotation, so verification cannot
    // complete without one — otherwise the quote would reach them with nothing
    // to open.
    if (!constrobidQuotation || !String(constrobidQuotation).trim()) {
      return res.status(400).json({
        error: 'Please upload the ConstroBID Team Quotation before verifying.',
      });
    }

const quote = await Quotation.findByIdAndUpdate(
  quoteId,
  {
    isVerified: true,
    rejected: false,
    requoteRequested: false,
    inspectorRemarks: remarks,
    constrobidQuotation: String(constrobidQuotation).trim(),
    constrobidQuotationName: constrobidQuotationName || 'ConstroBID Quotation',
  },
  {
    new: true,
  }
).populate('contractorId').lean().exec();
    await Project.findByIdAndUpdate(id, { status: ProjectStatus.CLIENT_COMPARISON as any }).exec();

    const project = await Project.findById(id).lean().exec();
    if (project) {
      const client = await Client.findById(project.clientId).lean().exec();
      const user = client ? await User.findById((client as any).userId).lean().exec() : null;
      const userEmail = (user as any)?.email;
      if (userEmail) await sendEmail({ to: userEmail, templateType: 'QUOTATION_RECEIVED', context: { clientName: (client as any)?.name || '', projectTitle: project.title || '' } });
    }

    await AuditLog.create({ action: 'QUOTATION_VERIFIED', details: `Quotation ${quoteId} verified by Inspection Team`, userId: req.user?.id });
    broadcastDataChanged(['quotations', 'projects']);
    return res.json(quote);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// REMOVE A BOQ FILE (Inspector/Admin only).
// Deletes the stored file, strips it from the conversation so the client is not
// left with a dead attachment, and clears the selection if it pointed here.
export async function deleteBoqFile(req: AuthenticatedRequest, res: Response) {
  const { id, fileId } = req.params;

  try {
    const role = req.user?.role;
    if (role !== Role.INSPECTION_TEAM && role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Only the inspection team can remove a BOQ' });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file id' });
    }

    const file = await ProjectFile.findOne({
      _id: fileId,
      projectId: id,
      'meta.category': 'BOQ',
    }).lean();

    if (!file) return res.status(404).json({ error: 'BOQ file not found' });

    await ProjectFile.deleteOne({ _id: fileId }).exec();

    await Message.updateMany(
      { conversationId: new mongoose.Types.ObjectId(id) },
      { $pull: { attachments: { fileId: new mongoose.Types.ObjectId(fileId) } } } as any
    ).exec();

    const project = await Project.findById(id);
    if (project && String((project as any).selectedBoqId) === String(fileId)) {
      (project as any).selectedBoqId = null;
      await project.save();
    }

    await AuditLog.create({
      action: 'BOQ_FILE_REMOVED',
      details: `BOQ file ${fileId} removed from project ${id}`,
      userId: req.user?.id,
    });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteBoqFile', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// SEND A QUOTATION BACK FOR RE-QUOTING (Inspector/Admin only).
// Unlike a rejection this keeps the quotation in play — the contractor is
// expected to submit revised figures, so it stays neither verified nor rejected.
export async function requestRequote(
  req: AuthenticatedRequest,
  res: Response
) {
  const { quoteId } = req.params;

  try {
    const { remarks } = req.body;

    const quote = await Quotation.findByIdAndUpdate(
      quoteId,
      {
        isVerified: false,
        rejected: false,
        requoteRequested: true,
        inspectorRemarks: remarks,
      },
      { new: true }
    )
      .populate({ path: 'contractorId', populate: { path: 'userId', model: 'User' } })
      .populate('projectId');

    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const contractorDoc = (quote as any).contractorId;
    const contractorEmail = contractorDoc?.userId?.email;
    if (contractorEmail) {
      try {
        await sendEmail({
          to: contractorEmail,
          templateType: 'REQUOTE_REQUESTED',
          context: {
            companyName: contractorDoc?.companyName || '',
            projectTitle: (quote as any).projectId?.title || '',
            remarks: remarks || '',
          },
        });
      } catch (emailError) {
        logger.error('requestRequote email failed', emailError);
      }
    }

    await AuditLog.create({
      action: "QUOTATION_REQUOTE_REQUESTED",
      details: `Re-quote requested for quotation ${quoteId}`,
      userId: req.user?.id,
    });

    broadcastDataChanged(['quotations', 'projects']);
    return res.json(quote);

  } catch (error) {
    logger.error('requestRequote', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rejectQuotation(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id, quoteId } = req.params;

  try {
    const { remarks } = req.body;

    const quote = await Quotation.findByIdAndUpdate(
      quoteId,
      {
        isVerified: false,
        rejected: true,
        inspectorRemarks: remarks,
      },
      { new: true }
    );

    await AuditLog.create({
      action: "QUOTATION_REJECTED",
      details: `Quotation ${quoteId} rejected`,
      userId: req.user?.id,
    });

    broadcastDataChanged(['quotations', 'projects']);
    return res.json(quote);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to reject quotation",
    });
  }
}


// SELECT CONTRACTOR (Client only)
export async function selectContractor(req: AuthenticatedRequest, res: Response) {
const { id, quoteId } = req.params;
const clientId = req.user?.clientId;

console.log('Selecting contractor...');
console.log('Project:', id);
console.log('Quotation:', quoteId);

try {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project id' });
  }

  if (!mongoose.Types.ObjectId.isValid(quoteId)) {
    return res.status(400).json({ error: 'Invalid quotation id' });
  }

  const project = await Project.findById(id).lean().exec();
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (String(project.clientId) !== String(clientId)) {
    return res.status(403).json({ error: 'Not authorized to manage this project' });
  }

  console.log('Project status:', project.status);

  if (project.status !== ProjectStatus.CLIENT_COMPARISON) {
    return res.status(400).json({ error: 'Invalid project status' });
  }

  const selectedQuote = await Quotation.findById(quoteId).populate({ path: 'contractorId', populate: { path: 'userId', model: 'User' } }).lean().exec();
  if (!selectedQuote) {
    return res.status(404).json({ error: 'Quotation not found' });
  }

  console.log('Quotation found:', true);
  console.log('Quotation verified:', !!selectedQuote.isVerified);
  console.log('Quotation project:', String(selectedQuote.projectId));

  if (String(selectedQuote.projectId) !== String(project._id)) {
    return res.status(400).json({ error: 'Quotation does not belong to this project' });
  }

  if (!selectedQuote.isVerified) {
    return res.status(400).json({ error: 'Contractor has no verified quotation' });
  }

  if ((selectedQuote as any).contractorDeclined) {
    return res.status(400).json({ error: 'This contractor already declined this project and cannot be re-selected.' });
  }

  const selectedContractorId = (selectedQuote as any).contractorId?._id || (selectedQuote as any).contractorId;
  if (!selectedContractorId) {
    return res.status(400).json({ error: 'Quotation is missing contractor information' });
  }

  const existingSelected = await Quotation.findOne({ projectId: project._id, selected: true }).lean().exec();
  if (existingSelected && String(existingSelected._id) !== String(quoteId)) {
    return res.status(400).json({ error: 'A contractor has already been selected for this project.' });
  }

  await Quotation.updateMany({ projectId: project._id }, { $set: { selected: false } }).exec();
  await Quotation.findByIdAndUpdate(quoteId, { $set: { selected: true, isVerified: true } }).exec();

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    {
      contractorId: selectedContractorId,
      selectedContractor: selectedContractorId,
      selectedQuotation: quoteId,
      contractorConfirmed: false,
      status: ProjectStatus.CONTRACTOR_SELECTED as any,
    },
    { new: true }
  ).lean().exec();

  if (!updatedProject) {
    return res.status(500).json({ error: 'Database error' });
  }

  console.log('Updated status:', updatedProject.status);

  try {
    await ProjectUpdate.create({
      projectId: new mongoose.Types.ObjectId(id),
      notes: `Contractor selected for quotation ${quoteId}`,
      contractorId: new mongoose.Types.ObjectId(String(selectedContractorId)),
    } as any);
  } catch (timelineError) {
    logger.error('selectContractor timeline error', timelineError);
  }

  const contractorDoc = (selectedQuote as any).contractorId;
  const contractorUserId = contractorDoc?.userId || null;
  let contractorEmail: string | null = null;

  try {
    const contractorUser = contractorUserId ? await User.findById(contractorUserId).lean().exec() : null;
    contractorEmail = (contractorUser as any)?.email || null;
  } catch (userLookupError) {
    logger.error('selectContractor contractor user lookup failed', userLookupError);
  }

  if (contractorEmail) {
    try {
      await sendEmail({ to: contractorEmail, templateType: 'CONTRACTOR_SELECTED', context: { companyName: contractorDoc?.companyName || '', projectTitle: project.title || '' } });
    } catch (emailError) {
      logger.error('selectContractor email failed', emailError);
    }
  }

  // The other bidders currently just never hear back — let them know the
  // project has been awarded so they can move on to other bids.
  try {
    const otherQuotations = await Quotation.find({
      projectId: project._id,
      contractorId: { $ne: selectedContractorId },
    })
      .populate({ path: 'contractorId', populate: { path: 'userId', model: 'User' } })
      .lean()
      .exec();

    for (const q of otherQuotations) {
      const losingContractor = (q as any).contractorId;
      const losingEmail = losingContractor?.userId?.email;
      if (!losingEmail) continue;
      try {
        await sendEmail({
          to: losingEmail,
          templateType: 'BID_NOT_SELECTED',
          context: { companyName: losingContractor?.companyName || '', projectTitle: project.title || '' },
        });
      } catch (emailError) {
        logger.error('selectContractor losing-bidder email failed', emailError);
      }
    }
  } catch (lookupError) {
    logger.error('selectContractor losing-bidder lookup failed', lookupError);
  }

  try {
    await AuditLog.create({ action: 'CONTRACTOR_SELECTED', details: `Contractor ${selectedContractorId} selected for project ${id}`, userId: req.user?.id });
  } catch (auditError) {
    logger.error('selectContractor audit log failed', auditError);
  }

  console.log('Database save success');
  console.log('Final response:', updatedProject?._id);
  broadcastDataChanged(['quotations', 'projects', 'contractors']);
  return res.json(updatedProject);
} catch (error) {
  logger.error('selectContractor', error);

  if ((error as any)?.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid project or quotation id' });
  }

  if ((error as any)?.name === 'ValidationError') {
    return res.status(400).json({ error: 'Database validation error' });
  }

  return res.status(500).json({ error: 'Database error' });
}
}

// CLIENT SELECTS FINAL DESIGN
export async function selectProjectFiles(
req: AuthenticatedRequest,
res: Response                                                                   
) {
try {
  const { id } = req.params;
  const { selectedDesignId, selectedBoqId } = req.body;

  if (!selectedDesignId) {
    return res.status(400).json({ error: 'Please select a Design.' });
  }

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ error: 'Project not found' });


  if (!mongoose.Types.ObjectId.isValid(selectedDesignId)) {
    return res.status(400).json({ error: 'Selected Design ID is invalid.' });
  }

  const selectedDesign = await ProjectFile.findOne({
    _id: selectedDesignId,
    projectId: id,
    'meta.category': 'DESIGN',
  }).lean();

  if (!selectedDesign) {
    return res.status(404).json({ error: 'Selected Design not found.' });
  }

  if (selectedBoqId) {
    if (!mongoose.Types.ObjectId.isValid(selectedBoqId)) {
      return res.status(400).json({ error: 'Selected BOQ ID is invalid.' });
    }

    const selectedBoq = await ProjectFile.findOne({
      _id: selectedBoqId,
      projectId: id,
      'meta.category': 'BOQ',
    }).lean();

    if (!selectedBoq) {
      return res.status(404).json({ error: 'Selected BOQ not found.' });
    }

    project.selectedBoqId = selectedBoqId;
  }

  project.selectedDesignId = selectedDesignId;
  project.approvedDesignId = selectedDesignId;
  project.clientApproved = true;
  project.clientApprovedAt = new Date();
  project.status = ProjectStatus.DESIGN_APPROVED as any;

  await project.save();

  // The conversation room is keyed by project id, so the inspector viewing this
  // thread is told the client has confirmed and can move on from the chat.
  try {
    getIO().to(String(id)).emit('project.designConfirmed', {
      projectId: String(id),
      status: project.status,
      title: project.title,
    });
  } catch (e) {}

  broadcastDataChanged(['projects', 'designs']);
  return res.json({ success: true, message: 'Design selected successfully.', project });
} catch (error) {
  logger.error('selectProjectFiles', error);
  return res.status(500).json({ error: 'Internal server error' });
}
}
export async function saveQuotationDraft(
req: AuthenticatedRequest,
res: Response
) {
try {
  const { id } = req.params;
  const contractorId = req.user?.contractorId;

  if (!contractorId) {
    return res.status(403).json({
      error: "Contractor not found",
    });
  }
  const project = await Project.findById(id);

if (!project) {
return res.status(404).json({
  error: "Project not found",
});
}

const isAssignedContractor = String(project.selectedContractor || project.contractorId) === String(contractorId);
const canUpdateActiveCostDraft = isAssignedContractor && [
  ProjectStatus.CONTRACTOR_CONFIRMED,
  ProjectStatus.WORK_STARTED,
  ProjectStatus.IN_PROGRESS,
].includes(project.status as ProjectStatus);

if (!isQuotationSubmissionOpen(project.status) && !canUpdateActiveCostDraft) {
return res.status(400).json({ error: getQuotationClosedMessage() });
}

  const draft = await QuotationDraft.findOneAndUpdate(
    {
      projectId: id,
      contractorId,
    },
    {
      ...req.body,
      projectId: id,
      contractorId,
    },
    {
      upsert: true,
      new: true,
    }
  );
  

  return res.json(draft);
} catch (error) {
  console.error(error);

  return res.status(500).json({
    error: "Failed to save quotation draft",
  });
}
}

export async function getQuotationDraft(
req: AuthenticatedRequest,
res: Response
) {
try {
  const { id } = req.params;

  const contractorId = req.user?.contractorId;

  if (!contractorId) {
    return res.status(403).json({
      error: "Contractor not found",
    });
  }

  const draft = await QuotationDraft.findOne({
    projectId: id,
    contractorId,
  });

  return res.json(draft || {});
} catch (error) {
  console.error(error);

  return res.status(500).json({
    error: "Failed to load quotation draft",
  });
}
}

// CLIENT/CONTRACTOR CONTRACT CONFIRMED -> WORK STARTED
export async function confirmContractor(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const updatedProject = await Project.findByIdAndUpdate(id, { status: ProjectStatus.WORK_STARTED as any }, { new: true }).lean().exec();

    if (updatedProject) {
      const client = await Client.findById((updatedProject as any).clientId).lean().exec();
      const user = client ? await User.findById((client as any).userId).lean().exec() : null;
      const userEmail = (user as any)?.email;
      if (userEmail) await sendEmail({ to: userEmail, templateType: 'WORK_STARTED', context: { clientName: (client as any)?.name || '', projectTitle: (updatedProject as any).title || '' } });
    }

    await Project.findByIdAndUpdate(id, { status: ProjectStatus.IN_PROGRESS as any }).exec();
    broadcastDataChanged(['projects']);
    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CONTRACTOR DAILY PROGRESS LOGS
export async function submitDailyUpdate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { notes, photos } = req.body;
  const contractorId = req.user?.contractorId;

  if (!contractorId) return res.status(403).json({ error: 'Contractor profile not found' });

  try {
    const update = await ProjectUpdate.create({ projectId: id, notes, photos: photos || [], contractorId: new mongoose.Types.ObjectId(contractorId) });
    return res.status(201).json(update);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// INSPECTOR SITE VISIT / QUALITY AUDIT
export async function submitSiteVisit(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { reportType, notes, photos } = req.body;
  const inspectionTeamId = req.user?.inspectionTeamId;

  if (!inspectionTeamId) return res.status(403).json({ error: 'Inspection team profile not found' });

  try {
    const visit = await SiteVisitReport.create({ projectId: id, inspectorId: new mongoose.Types.ObjectId(inspectionTeamId), reportType: reportType as any, notes, photos: photos || [] });
    return res.status(201).json(visit);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CONTRACTOR REQUEST COMPLETION AUDIT
export async function requestCompletion(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const contractorId = req.user?.contractorId;

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project || String(project.contractorId || '') !== String(contractorId || '')) return res.status(403).json({ error: 'Not authorized for this project' });

    const updatedProject = await Project.findByIdAndUpdate(id, { status: ProjectStatus.COMPLETION_VERIFICATION as any }, { new: true }).lean().exec();

    const client = await Client.findById(project.clientId).lean().exec();
    const user = client ? await User.findById((client as any).userId).lean().exec() : null;
    const userEmail = (user as any)?.email;
    if (userEmail) await sendEmail({ to: userEmail, templateType: 'COMPLETION_VERIFICATION', context: { clientName: (client as any)?.name || '', projectTitle: project.title || '' } });

    broadcastDataChanged(['projects', 'completion']);
    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// INSPECTOR APPROVE HANDOVER
export async function approveCompletion(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const updatedProject = await Project.findByIdAndUpdate(id, { status: ProjectStatus.PROJECT_COMPLETED as any }, { new: true }).lean().exec();

    const client = await Client.findById(project.clientId).lean().exec();
    const user = client ? await User.findById((client as any).userId).lean().exec() : null;
    const userEmail = (user as any)?.email;
    if (userEmail) await sendEmail({ to: userEmail, templateType: 'PROJECT_COMPLETED', context: { clientName: (client as any)?.name || '', projectTitle: project.title || '' } });

    if (project.contractorId) {
      try {
        const contractor = await Contractor.findById(project.contractorId).lean().exec();
        const contractorUser = contractor ? await User.findById((contractor as any).userId).lean().exec() : null;
        const contractorEmail = (contractorUser as any)?.email;
        if (contractorEmail) {
          await sendEmail({
            to: contractorEmail,
            templateType: 'PROJECT_COMPLETED_CONTRACTOR',
            context: { companyName: (contractor as any)?.companyName || '', projectTitle: project.title || '' },
          });
        }
      } catch (emailError) {
        logger.error('approveCompletion contractor email failed', emailError);
      }
    }

    await AuditLog.create({ action: 'COMPLETION_APPROVED', details: `Project ${id} completion audit approved by Inspection Team`, userId: req.user?.id });

    broadcastDataChanged(['projects', 'completion']);
    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CLIENT SUBMIT RATING & REVIEW (Client only)
export async function submitReview(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const clientId = req.user?.clientId;

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project || String(project.clientId) !== String(clientId)) return res.status(403).json({ error: 'Not authorized' });
    if (!project.contractorId) return res.status(400).json({ error: 'Contractor not assigned to this project' });

    const review = await Review.create({ projectId: project._id, clientId: new mongoose.Types.ObjectId(clientId), contractorId: project.contractorId, rating: parseInt(rating, 10), comment });
    await Project.findByIdAndUpdate(id, { status: ProjectStatus.REVIEW_SUBMITTED as any }).exec();
    return res.status(201).json(review);
  } catch (error) {
    logger.error('submitReview', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// CANCEL PROJECT
export async function cancelProject(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const role = req.user?.role;
  const clientId = req.user?.clientId;

  try {
    const project = await Project.findById(id).lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (String(project.status) === String(ProjectStatus.PENDING_INSPECTION)) {
      if (String(project.clientId) !== String(clientId) && role !== Role.ADMIN) return res.status(403).json({ error: 'Unauthorized to cancel' });
      const updated = await Project.findByIdAndUpdate(id, { status: ProjectStatus.CANCELLED as any }, { new: true }).lean().exec();
      broadcastDataChanged(['projects']);
      return res.json({ message: 'Project cancelled successfully', project: updated });
    }

    const statusBeforeSelection: any[] = [ProjectStatus.INSPECTION_SCHEDULED, ProjectStatus.INSPECTION_COMPLETED, ProjectStatus.DESIGN_CREATION, ProjectStatus.DESIGN_SUBMITTED, ProjectStatus.CLIENT_REVIEW, ProjectStatus.DESIGN_APPROVED, ProjectStatus.PROJECT_PUBLISHED, ProjectStatus.BIDDING_OPEN, ProjectStatus.CLIENT_COMPARISON];
    if (statusBeforeSelection.includes(project.status as any)) {
      if (role === Role.ADMIN || role === Role.INSPECTION_TEAM) {
        const updated = await Project.findByIdAndUpdate(id, { status: ProjectStatus.CANCELLED as any }, { new: true }).lean().exec();
        broadcastDataChanged(['projects']);
        return res.json({ message: 'Project cancelled by management', project: updated });
      }
      return res.json({ message: 'Cancellation request submitted. Inspection Team review pending.', requiresApproval: true });
    }

    

    return res.status(400).json({ error: 'Project work is active. Cancellation requires dispute investigation and admin decision.', requiresDispute: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// RAISE A DISPUTE
export async function raiseDispute(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const role = req.user?.role;

  try {
    const dispute = await Dispute.create({ projectId: id, raisedBy: new mongoose.Types.ObjectId(req.user!.id), reason, status: DisputeStatus.OPEN as any });
    await Project.findByIdAndUpdate(
    id,
    {
        status: ProjectStatus.INSPECTION_REJECTED,
        inspectionRejectedReason: reason,
    },
    { new: true }
);
    return res.status(201).json(dispute);
  } catch (error) {
    console.error("Raise Dispute Error:", error);

    return res.status(500).json({
        error: "Internal server error"
    });
}
}



// PUBLISH PROJECT: mark as PROJECT_PUBLISHED and notify matching contractors
export async function publishProject(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { quotationDeadline } = req.body;

    try {
    const project = await Project.findById(id).exec();
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!quotationDeadline) {
  return res.status(400).json({
    error: "Quotation deadline is required.",
  });
}
    if (!project.clientApproved || !project.approvedDesignId) {
      return res.status(400).json({ error: 'Client must confirm a design before project approval.' });
    }

    project.status = ProjectStatus.PROJECT_PUBLISHED as any;

project.inspectorApproved = true;
project.inspectorApprovedAt = new Date();

project.quotationDeadline = new Date(quotationDeadline);
project.biddingOpenedAt = new Date();
project.quotationStatus = "OPEN";

    console.log("Before Save:", project.inspectionCompletedAt);
    await project.save();
    console.log("After Save:", project.inspectionCompletedAt);

    const updatedProject = project.toObject();

console.log("========== PROJECT PUBLISHED ==========");
console.log(updatedProject);

    // Find verified contractors matching city or category
    const contractorFilter: any = { status: ContractorStatus.VERIFIED };
    if (project.city) contractorFilter.serviceCities = project.city;
    if (project.category) contractorFilter.serviceCategories = project.category;

    const contractors = await Contractor.find(contractorFilter).populate('userId').lean().exec();

    // Send notification emails to matching contractors
    for (const c of contractors || []) {
      try {
        const user = (c as any).userId;
        const to = user?.email;
        if (to) {
          await sendEmail({
            to,
            templateType: 'PROJECT_PUBLISHED',
            context: { companyName: c.companyName || c.name || '', projectTitle: project.title || '', city: project.city || '' },
          });
        }
      } catch (e) {
        logger.error('publishProject: notify contractor failed', { contractor: c._id, error: (e as any)?.message });
      }
    }

    await AuditLog.create({ action: 'PROJECT_PUBLISHED', details: `Project ${id} published to contractors`, userId: req.user?.id });

    broadcastDataChanged(['projects', 'quotations']);
    return res.json({ project: updatedProject, notified: (contractors || []).length });
  } catch (error) {
    logger.error('publishProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getQuotationSummary(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const quotations = await Quotation.find({})
  .populate({
    path: "projectId",
    populate: {
      path: "clientId",
      model: "Client",
      select: "name",
    },
  })
  .populate("contractorId")
  .lean();

    const groupedProjects = new Map();

    quotations.forEach((quote: any) => {
      const project = quote.projectId;

      if (!project) return;

      if (!groupedProjects.has(project._id.toString())) {
        groupedProjects.set(project._id.toString(), {
          projectId: project._id,
          title: project.title,
          propertyType: project.propertyType,
          city: project.city,
          clientName: project.clientId?.name || "Unknown Client",
          quotationDeadline: project.quotationDeadline,
          quotations: [],
        });
      }

      groupedProjects.get(project._id.toString()).quotations.push(quote);
    });

    const result = Array.from(groupedProjects.values()).map((project: any) => {
      const quotes = project.quotations;

      const amounts = quotes.map((q: any) => q.cost);

      return {
        projectId: project.projectId,
        title: project.title,
        propertyType: project.propertyType,
        city: project.city,
        clientName: project.clientName,
        quotationDeadline: project.quotationDeadline,

        totalQuotes: quotes.length,

        pendingQuotes: quotes.filter((q: any) => !q.isVerified).length,

        verifiedQuotes: quotes.filter((q: any) => q.isVerified).length,

        rejectedQuotes: quotes.filter((q: any) => q.isRejected).length,

        lowestQuote: Math.min(...amounts),

        highestQuote: Math.max(...amounts),

        submittedToday: quotes.filter((q: any) => {
          return (
            new Date(q.createdAt).toDateString() ===
            new Date().toDateString()
          );
        }).length,

        quotations: quotes,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to load quotation summary",
    });
  }
}

export async function getProjectQuotations(

  
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params;

    console.log("========== GET PROJECT QUOTATIONS ==========");
console.log("Project ID:", id);

    const project = await Project.findById(
    new mongoose.Types.ObjectId(id)
)
.populate("clientId")
.lean();



console.log("Project Found:");
console.log(project);

const quotations = await Quotation.find({
    projectId: new mongoose.Types.ObjectId(id),
})
.populate("contractorId")
.lean();
const quotationsWithDraft = await Promise.all(
  quotations.map(async (quotation: any) => {

    const draft = await QuotationDraft.findOne({
      projectId: quotation.projectId,
      contractorId: quotation.contractorId._id,
    }).lean();

    return {
      ...quotation,
      draft,
    };

  })
);

console.log("Project ID:", id);
console.log("Found quotations:", quotations.length);
console.log(quotations);

return res.json({
    project,
    quotations: quotationsWithDraft,
});

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to load quotations",
    });
  }
}
export async function getQuotationById(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { quoteId } = req.params;

    const quotation = await Quotation.findById(quoteId)
      .populate("contractorId")
      .lean();

    if (!quotation) {
      return res.status(404).json({
        error: "Quotation not found",
      });
    }

    return res.json(quotation);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to load quotation",
    });
  }
}

// CONTRACTOR ACCEPT PROJECT
export async function acceptProject(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params;

    const contractorId = req.user?.contractorId;

    if (!contractorId) {
      return res.status(403).json({
        error: "Contractor not found",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    // Make sure this contractor is the selected contractor
    if (String(project.contractorId) !== String(contractorId)) {
      return res.status(403).json({
        error: "This project is not assigned to you.",
      });
    }

    // ACCEPTANCE WORKFLOW: repeated accepts are idempotent for the assigned contractor.
    if (project.contractorAccepted) {
      return res.json({
        success: true,
        message: "Project already accepted.",
        project,
      });
    }

    project.contractorAccepted = true;
    project.contractorAcceptedAt = new Date();
    
    project.status = "CONTRACTOR_CONFIRMED";

    await project.save();

    broadcastDataChanged(['projects', 'contractors']);
    return res.json({
      success: true,
      message: "Project accepted successfully.",
      project,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Failed to accept project",
    });

  }
}

// The contractor was selected by the client but declines before confirming
// (e.g. schedule conflict, scope mismatch). Reopens the project for the
// client to pick a different verified quotation instead.
export async function declineProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const contractorId = req.user?.contractorId;

    if (!contractorId) {
      return res.status(403).json({ error: 'Contractor not found' });
    }

    const project = await Project.findById(id).exec();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (String(project.contractorId) !== String(contractorId)) {
      return res.status(403).json({ error: 'This project is not assigned to you.' });
    }

    if (project.status !== ('CONTRACTOR_SELECTED' as any)) {
      return res.status(400).json({
        error: project.contractorAccepted
          ? 'This project has already been accepted and can no longer be declined here.'
          : 'This project is not awaiting your acceptance.',
      });
    }

    const selectedQuotationId = project.selectedQuotation;

    if (selectedQuotationId) {
      await Quotation.findByIdAndUpdate(selectedQuotationId, {
        selected: false,
        contractorDeclined: true,
        contractorDeclineReason: reason || '',
        contractorDeclinedAt: new Date(),
      }).exec();
    }

    // If another verified bid is still on the table, the client just picks
    // again from the existing comparison. If this was the only one left, the
    // project has genuinely stalled — that surfaces to the inspector as a
    // "needs bidding reopened" item (see needsBiddingReopen in getProjects)
    // rather than the system silently picking a new deadline itself.
    const otherVerifiedBids = await Quotation.countDocuments({
      projectId: project._id,
      isVerified: true,
      contractorDeclined: { $ne: true },
      _id: { $ne: selectedQuotationId },
    });
    const noUsableBidsLeft = otherVerifiedBids === 0;

    project.contractorId = undefined as any;
    project.selectedContractor = undefined as any;
    project.selectedQuotation = undefined as any;
    project.contractorAccepted = false;
    project.status = ProjectStatus.CLIENT_COMPARISON as any;

    await project.save();

    try {
      const client = await Client.findById(project.clientId).lean().exec();
      const user = client ? await User.findById((client as any).userId).lean().exec() : null;
      const userEmail = (user as any)?.email;
      const contractor = await Contractor.findById(contractorId).lean().exec();
      if (userEmail) {
        await sendEmail({
          to: userEmail,
          templateType: 'CONTRACTOR_DECLINED',
          context: {
            clientName: (client as any)?.name || 'Client',
            projectTitle: project.title || '',
            companyName: (contractor as any)?.companyName || '',
            reason: reason || 'No reason given.',
            nextStep: noUsableBidsLeft
              ? 'No other verified contractors are available right now — our inspection team is reviewing your project and will reopen bidding shortly.'
              : 'You can select a different verified contractor from your comparison list right away.',
          },
        });
      }
    } catch (emailError) {
      logger.error('declineProject client email failed', emailError);
    }

    try {
      await AuditLog.create({
        action: 'CONTRACTOR_DECLINED_PROJECT',
        details: `Contractor ${contractorId} declined project ${id}${reason ? `: ${reason}` : ''}`,
        userId: req.user?.id,
      });
    } catch (auditError) {
      logger.error('declineProject audit log failed', auditError);
    }

    broadcastDataChanged(['projects', 'quotations', 'contractors']);
    return res.json({
      success: true,
      message: 'Project declined. The client can now select a different contractor.',
      project,
    });
  } catch (error) {
    logger.error('declineProject', error);
    return res.status(500).json({ error: 'Failed to decline project' });
  }
}

// Inspector-driven reopen for a project that stalled with zero usable bids
// (see needsBiddingReopen in getProjects). Sets a fresh deadline and puts the
// project back into BIDDING_OPEN so contractors can submit new quotations.
export async function reopenBidding(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { quotationDeadline } = req.body;
    const inspectionTeamId = req.user?.inspectionTeamId;

    if (!inspectionTeamId) {
      return res.status(403).json({ error: 'Inspection team profile not found' });
    }
    if (!quotationDeadline) {
      return res.status(400).json({ error: 'A new bidding deadline is required' });
    }
    const newDeadline = new Date(quotationDeadline);
    if (isNaN(newDeadline.getTime()) || newDeadline.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Bidding deadline must be a valid future date/time' });
    }

    const project = await Project.findById(id).exec();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (
      ![ProjectStatus.PROJECT_PUBLISHED, ProjectStatus.BIDDING_OPEN, ProjectStatus.CLIENT_COMPARISON].includes(
        project.status as any
      )
    ) {
      return res.status(400).json({ error: 'This project is not in a state that can be reopened for bidding.' });
    }

    const usableQuotationCount = await Quotation.countDocuments({
      projectId: project._id,
      isVerified: true,
      contractorDeclined: { $ne: true },
    });
    if (usableQuotationCount > 0) {
      return res.status(400).json({ error: 'This project still has a usable verified quotation — bidding does not need to be reopened.' });
    }

    project.status = ProjectStatus.BIDDING_OPEN as any;
    project.quotationDeadline = newDeadline as any;
    await project.save();

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    try {
      const client = await Client.findById(project.clientId).lean().exec();
      const user = client ? await User.findById((client as any).userId).lean().exec() : null;
      const userEmail = (user as any)?.email;
      if (userEmail) {
        await sendEmail({
          to: userEmail,
          templateType: 'BIDDING_REOPENED',
          context: {
            clientName: (client as any)?.name || 'Client',
            projectTitle: project.title || '',
            deadlineDate: formatDate(newDeadline),
            deadlineTime: formatTime(newDeadline),
          },
        });
      }
    } catch (emailError) {
      logger.error('reopenBidding client email failed', emailError);
    }

    try {
      const contractors = await Contractor.find({ isVerified: true }).lean().exec();
      const contractorUserIds = contractors.map((c: any) => c.userId).filter(Boolean);
      const users = await User.find({ _id: { $in: contractorUserIds } }).lean().exec();
      const emailByUserId = new Map(users.map((u: any) => [String(u._id), u.email]));
      for (const contractor of contractors) {
        const email = emailByUserId.get(String((contractor as any).userId));
        if (!email) continue;
        await sendEmail({
          to: email,
          templateType: 'BIDDING_REOPENED_CONTRACTOR',
          context: {
            companyName: (contractor as any)?.companyName || 'Contractor',
            projectTitle: project.title || '',
            deadlineDate: formatDate(newDeadline),
            deadlineTime: formatTime(newDeadline),
          },
        });
      }
    } catch (emailError) {
      logger.error('reopenBidding contractor broadcast email failed', emailError);
    }

    try {
      await AuditLog.create({
        action: 'BIDDING_REOPENED',
        details: `Inspector reopened bidding for project ${id}, new deadline ${newDeadline.toISOString()}`,
        userId: req.user?.id,
      });
    } catch (auditError) {
      logger.error('reopenBidding audit log failed', auditError);
    }

    broadcastDataChanged(['projects', 'quotations']);
    return res.json({ success: true, message: 'Bidding reopened.', project });
  } catch (error) {
    logger.error('reopenBidding', error);
    return res.status(500).json({ error: 'Failed to reopen bidding' });
  }
}

export async function visitSite(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { id } = req.params;

    const contractorId = req.user?.contractorId;

    if (!contractorId) {
      return res.status(403).json({
        error: "Contractor not found",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    if (String(project.contractorId) !== String(contractorId)) {
      return res.status(403).json({
        error: "This project is not assigned to you.",
      });
    }

    project.contractorSiteVisited = true;
    project.contractorSiteVisitedAt = new Date();

    await project.save();

    return res.json({
      success: true,
      message: "Site Visit Completed",
      project,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Failed to complete site visit",
    });

  }
}

export async function getClientRecentQuotations(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const clientId = req.user?.clientId;
    

    if (!clientId) {
      return res.status(403).json({
        error: "Client profile not found",
      });
    }

    const projects = await Project.find({
  clientId,
})
  .select("_id title propertyType city quotationDeadline")
  .sort({ createdAt: -1 })
  .lean();

  const projectIds = projects.map((project) => project._id);

const quotations = await Quotation.find({
  projectId: { $in: projectIds },
  isVerified: true,
})
  .populate({
    path: "contractorId",
    select: "companyName name experience city",
  })
  .lean();
  
  const groupedProjects = new Map<string, any>();

quotations.forEach((quotation: any) => {
  const project = projects.find(
    (p: any) => p._id.toString() === quotation.projectId.toString()
  );

  if (!project) return;

  if (!groupedProjects.has(project._id.toString())) {
    groupedProjects.set(project._id.toString(), {
      projectId: project._id,
      title: project.title,
      propertyType: project.propertyType,
      city: project.city,
      quotationDeadline: project.quotationDeadline,
      quotations: [],
    });
  }

  groupedProjects
    .get(project._id.toString())
    .quotations.push(quotation);
});

  const result = Array.from(groupedProjects.values()).map((project: any) => {

  const quotes = project.quotations;

  const amounts = quotes.map(
    (q: any) => q.grandTotal || q.cost || 0
  );

  return {
    projectId: project.projectId,
    title: project.title,
    propertyType: project.propertyType,
    city: project.city,

    quotationDeadline: project.quotationDeadline,

    quotationCount: quotes.length,

    verifiedQuotes: quotes.length,

    lowestQuote:
      amounts.length > 0
        ? Math.min(...amounts)
        : 0,

    highestQuote:
      amounts.length > 0
        ? Math.max(...amounts)
        : 0,

    latestQuotationDate:
      quotes.length > 0
        ? quotes
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0].createdAt
        : null,
  };

});
return res.json(result);

  } catch (error: any) {
  console.error("========== CLIENT QUOTATIONS ERROR ==========");
  console.error(error);

  return res.status(500).json({
    message: error.message,
    stack: error.stack,
  });
}
}
