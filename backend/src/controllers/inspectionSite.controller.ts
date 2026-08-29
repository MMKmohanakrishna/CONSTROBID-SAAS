import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import mongoose from 'mongoose';
import { AuditLog } from '../models';
import logger from '../utils/logger';

const { ObjectId } = mongoose.Types;

// InspectionReport model is declared in models folder
import { InspectionReport, Project } from '../models';

// Helper to create audit
async function logAction(userId: any, action: string, details: string) {
  try {
    await AuditLog.create({ action, details, userId });
  } catch (e) {
    logger.warn('AuditLog error', e);
  }
}

// GET /inspection/site-inspections
export async function getSiteInspections(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, projectId } = req.query as any;
    const filter: any = {};
    if (status) filter.inspectionStatus = status;
    if (projectId) filter.projectId = projectId;

    // If inspector is logged in, restrict to assigned inspections
    if (req.user?.inspectionTeamId) filter.inspectionTeamId = req.user.inspectionTeamId;

    const list = await InspectionReport.find(filter)
  .populate({
    path: "inspectionTeamId",
    select: "fullName email profilePhoto",
  })
  .populate({
    path: "projectId",
    populate: [
      {
        path: "clientId",
        select: "fullName email phone",
      },
      {
        path: "selectedContractor",
        select: "companyName fullName email phone",
      },
    ],
  })
  .sort({ inspectionDate: -1 })
  .lean()
  .exec();

  console.log(
  JSON.stringify(list[0], null, 2)
);

    return res.json(list);
  } catch (error) {
    logger.error('getSiteInspections', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /inspection/site-inspections/:id
export async function getSiteInspectionById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const doc = await InspectionReport.findById(id).lean().exec();
    if (!doc) return res.status(404).json({ error: 'Inspection not found' });
    return res.json(doc);
  } catch (error) {
    logger.error('getSiteInspectionById', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections
export async function createSiteInspection(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body;
    const payload: any = {
      projectId: body.projectId ? new ObjectId(body.projectId) : undefined,
      inspectionTeamId: req.user?.inspectionTeamId ? new ObjectId(req.user.inspectionTeamId) : (body.inspectionTeamId ? new ObjectId(body.inspectionTeamId) : undefined),
      clientId: body.clientId ? new ObjectId(body.clientId) : undefined,
      inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
      inspectionStatus: body.inspectionStatus || 'SCHEDULED',
      propertyType: body.propertyType || '',
      projectCategory: body.projectCategory || '',
      address: body.address || '',
      city: body.city || '',
      plotArea: body.plotArea || '',
      builtUpArea: body.builtUpArea || '',
      floors: body.floors || 0,
      bedrooms: body.bedrooms || 0,
      bathrooms: body.bathrooms || 0,
      siteCondition: body.siteCondition || '',
      requirements: body.requirements || '',
      recommendations: body.recommendations || '',
      risks: body.risks || '',
      remarks: body.remarks || '',
      photos: body.photos || [],
      videos: body.videos || [],
      documents: body.documents || [],
      submittedAt: body.submittedAt || null,
    };

    const created = await InspectionReport.create(payload as any);
    await logAction(req.user?.id, 'INSPECTION_CREATED', `Inspection ${created._id} created`);
    return res.status(201).json(created);
  } catch (error) {
    logger.error('createSiteInspection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /inspection/site-inspections/:id
export async function updateSiteInspection(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const completedAt = new Date();

const updated = await InspectionReport.findByIdAndUpdate(
  id,
  {
    inspectionStatus: 'COMPLETED',
    completedAt,
  },
  { new: true }
).lean().exec();

if (!updated)
  return res.status(404).json({ error: 'Inspection not found' });

// Update the related Project
if (updated.projectId) {
  const project = await Project.findById(updated.projectId).exec();
  if (project) {
    project.status = 'INSPECTION_COMPLETED';
    if (!project.inspectionCompletedAt) {
      project.inspectionCompletedAt = completedAt;
    }
    await project.save();
  }
}

await logAction(
  req.user?.id,
  'INSPECTION_COMPLETED',
  `Inspection ${id} completed`
);

return res.json(updated);
  } catch (error) {
    logger.error('updateSiteInspection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/start
export async function startSiteInspection(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await InspectionReport.findByIdAndUpdate(id, { inspectionStatus: 'IN_PROGRESS', startedAt: new Date() }, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Inspection not found' });
    await logAction(req.user?.id, 'INSPECTION_STARTED', `Inspection ${id} started`);
    return res.json(updated);
  } catch (error) {
    logger.error('startSiteInspection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/complete
export async function completeSiteInspection(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await InspectionReport.findByIdAndUpdate(id, { inspectionStatus: 'COMPLETED', completedAt: new Date() }, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Inspection not found' });
    await logAction(req.user?.id, 'INSPECTION_COMPLETED', `Inspection ${id} completed`);
    return res.json(updated);
  } catch (error) {
    logger.error('completeSiteInspection', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/report
export async function submitInspectionReport(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const update: any = {
      report: body.report || {},
      inspectionStatus: 'SUBMITTED',
      submittedAt: new Date(),
    };
    const updated = await InspectionReport.findByIdAndUpdate(id, { $set: update }, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Inspection not found' });
    await logAction(req.user?.id, 'INSPECTION_REPORT_SUBMITTED', `Report for ${id} submitted`);
    return res.json(updated);
  } catch (error) {
    logger.error('submitInspectionReport', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/photos
export async function uploadInspectionPhotos(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { photos } = req.body; // array of URLs
    if (!Array.isArray(photos)) return res.status(400).json({ error: 'photos array required' });
    const updated = await InspectionReport.findByIdAndUpdate(id, { $push: { photos: { $each: photos } } }, { new: true }).lean().exec();
    await logAction(req.user?.id, 'INSPECTION_PHOTOS_UPLOADED', `Uploaded ${photos.length} photos to ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error('uploadInspectionPhotos', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/videos
export async function uploadInspectionVideos(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { videos } = req.body;
    if (!Array.isArray(videos)) return res.status(400).json({ error: 'videos array required' });
    const updated = await InspectionReport.findByIdAndUpdate(id, { $push: { videos: { $each: videos } } }, { new: true }).lean().exec();
    await logAction(req.user?.id, 'INSPECTION_VIDEOS_UPLOADED', `Uploaded ${videos.length} videos to ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error('uploadInspectionVideos', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/site-inspections/:id/documents
export async function uploadInspectionDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { documents } = req.body;
    if (!Array.isArray(documents)) return res.status(400).json({ error: 'documents array required' });
    const updated = await InspectionReport.findByIdAndUpdate(id, { $push: { documents: { $each: documents } } }, { new: true }).lean().exec();
    await logAction(req.user?.id, 'INSPECTION_DOCUMENTS_UPLOADED', `Uploaded ${documents.length} documents to ${id}`);
    return res.json(updated);
  } catch (error) {
    logger.error('uploadInspectionDocuments', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /inspection/site-inspections/:id/timeline
export async function getInspectionTimeline(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const logs = await AuditLog.find({ details: { $regex: id } }).sort({ createdAt: 1 }).lean().exec();
    return res.json(logs);
  } catch (error) {
    logger.error('getInspectionTimeline', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
