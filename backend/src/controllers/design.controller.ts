import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import mongoose from 'mongoose';
import {
  DesignPackage,
  DesignFile,
  MaterialEstimate,
  ScopeOfWork,
  AuditLog,
  Project,
  InspectionReport,
} from "../models";
import logger from '../utils/logger';

const { ObjectId } = mongoose.Types;

async function logAction(userId: any, action: string, details: string) {
  try {
    await AuditLog.create({ action, details, userId });
  } catch (error) {
    logger.warn('AuditLog error', error);
  }
}

export async function getDesignPackages(req: AuthenticatedRequest, res: Response) {
  try {
    const filter: any = {};
    if (req.user?.inspectionTeamId) filter.inspectionTeamId = req.user.inspectionTeamId;
    const list = await DesignPackage.find(filter)
      .sort({ updatedAt: -1 })
      .populate('designFiles floorPlans elevations materialEstimates scopeOfWorks')
      .lean()
      .exec();
    return res.json(list);
  } catch (error) {
    logger.error('getDesignPackages', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDesignDashboard(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const scheduled = await Project.find({
      status: "INSPECTION_SCHEDULED",
    })
      .populate("clientId", "name")
      .lean();

    const completed = await Project.find({
      status: "INSPECTION_COMPLETED",
    })
      .populate("clientId", "name")
      .lean();

    const confirmed = await Project.find({
      approvedDesignId: { $exists: true, $ne: null },
    })
      .populate("clientId", "name")
      .lean();

    const reports = await InspectionReport.find({})
  .select(
    "projectId inspectionDate inspectionStatus photos documents remarks"
  )
  .lean();

  const reportMap = new Map(
  reports.map((report: any) => [
    report.projectId.toString(),
    report,
  ])
);

const attachReport = (projects: any[]) =>
  projects.map((project) => {
    const report = reportMap.get(project._id.toString());

    return {
      ...project,

      inspectionDate: report?.inspectionDate || null,
      inspectionStatus: report?.inspectionStatus || "",

      reportPhotos: report?.photos || [],
      reportDocuments: report?.documents || [],
      reportRemarks: report?.remarks || "",
    };
  });

return res.json({
  scheduled: attachReport(scheduled),
  completed: attachReport(completed),
  confirmed: attachReport(confirmed),
});

  } catch (error) {
    logger.error("getDesignDashboard", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getDesignPackageById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const doc = await DesignPackage.findById(id)
      .populate('designFiles floorPlans elevations materialEstimates scopeOfWorks')
      .lean()
      .exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json(doc);
  } catch (error) {
    logger.error('getDesignPackageById', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createDesignPackage(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body;
    const payload: any = {
      projectId: body.projectId ? new mongoose.Types.ObjectId(body.projectId) : undefined,
      inspectionTeamId: req.user?.inspectionTeamId
        ? new mongoose.Types.ObjectId(req.user.inspectionTeamId)
        : body.inspectionTeamId
          ? new mongoose.Types.ObjectId(body.inspectionTeamId)
          : undefined,
      status: body.status || 'DRAFT',
      comments: body.comments || '',
    };
    const created = await DesignPackage.create(payload as any);
    await logAction(req.user?.id, 'DESIGN_CREATED', `Design package ${created._id} created`);
    logger.info('Design package created', { designPackageId: created._id });
    return res.status(201).json(created);
  } catch (error) {
    logger.error('createDesignPackage', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateDesignPackage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await DesignPackage.findByIdAndUpdate(id, { $set: req.body }, { new: true }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    await logAction(req.user?.id, 'DESIGN_UPDATED', `Design package ${id} updated`);
    return res.json(updated);
  } catch (error) {
    logger.error('updateDesignPackage', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function approveDesignPackage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await DesignPackage.findByIdAndUpdate(
      id,
      { status: 'APPROVED', approvedAt: new Date() },
      { new: true }
    ).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    await logAction(req.user?.id, 'DESIGN_APPROVED', `Design package ${id} approved`);
    logger.info('Design package approved', { designPackageId: id });
    return res.json(updated);
  } catch (error) {
    logger.error('approveDesignPackage', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rejectDesignPackage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await DesignPackage.findByIdAndUpdate(
      id,
      { status: 'REJECTED', comments: reason || '', approvedAt: null },
      { new: true }
    ).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    await logAction(req.user?.id, 'DESIGN_REJECTED', `Design package ${id} rejected: ${reason || 'no reason'}`);
    logger.info('Design package rejected', { designPackageId: id, reason: reason || '' });
    return res.json(updated);
  } catch (error) {
    logger.error('rejectDesignPackage', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadDesignFiles(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { type, files } = req.body as any;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    if (!type || !Array.isArray(files)) return res.status(400).json({ error: 'type and files required' });

    const allowedTypes = ['designFiles', 'floorPlans', 'elevations', 'materialEstimates', 'scope'];
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Unsupported design file type' });

    const createdIds: any[] = [];
    for (const file of files) {
      const urlVal = file.url || file.fileUrl || file.file_url;
      if (!urlVal) throw new Error('file url missing in payload for one of the files');

      if (['designFiles', 'floorPlans', 'elevations'].includes(type)) {
        const designFile = await DesignFile.create({
          fileUrl: urlVal,
          url: file.url,
          filename: file.filename,
          fileType: file.fileType,
          uploadedBy: req.user?.id,
        });
        createdIds.push(designFile._id);
      } else if (type === 'materialEstimates') {
        const materialEstimate = await MaterialEstimate.create({
          url: urlVal,
          filename: file.filename,
          uploadedBy: req.user?.id,
          items: file.items || [],
        });
        createdIds.push(materialEstimate._id);
      } else if (type === 'scope') {
        const scope = await ScopeOfWork.create({
          url: urlVal,
          filename: file.filename,
          uploadedBy: req.user?.id,
          description: file.description || '',
        });
        createdIds.push(scope._id);
      }
    }

    const update: any = {};
    if (type === 'designFiles') update.$push = { designFiles: { $each: createdIds } };
    if (type === 'floorPlans') update.$push = { floorPlans: { $each: createdIds } };
    if (type === 'elevations') update.$push = { elevations: { $each: createdIds } };
    if (type === 'materialEstimates') update.$push = { materialEstimates: { $each: createdIds } };
    if (type === 'scope') update.$push = { scopeOfWorks: { $each: createdIds } };

    const updated = await DesignPackage.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    await logAction(req.user?.id, 'DESIGN_FILES_UPLOADED', `Uploaded ${createdIds.length} files to ${id} type=${type}`);
    return res.json({ ok: true, uploaded: createdIds.length, updated });
  } catch (error) {
    const err: any = error;
    logger.error('uploadDesignFiles', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
