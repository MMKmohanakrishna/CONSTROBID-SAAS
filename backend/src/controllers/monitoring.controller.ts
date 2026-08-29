import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Project, ProjectUpdate, SiteVisitReport, MonitoringReport, AuditLog } from '../models';
import logger from '../utils/logger';

const { ObjectId } = mongoose.Types;

async function logAction(userId: any, action: string, details: string) {
  try { await AuditLog.create({ action, details, userId }); } catch (e) { logger.warn('AuditLog error', e); }
}

export async function getMonitoringSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const totalUpdates = await ProjectUpdate.countDocuments({}).exec();
    const totalVisits = await SiteVisitReport.countDocuments({}).exec();
    const projectsUnderMonitoring = await Project.countDocuments({ status: 'IN_PROGRESS' as any }).exec();
    const delayedCount = await ProjectUpdate.countDocuments({ notes: /delay|delayed|delay:/i }).exec();
    return res.json({ totalUpdates, totalVisits, projectsUnderMonitoring, delayedCount });
  } catch (error) { logger.error('getMonitoringSummary', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function listProjectUpdates(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.query as any;
    const filter: any = {};
    if (projectId && ObjectId.isValid(projectId)) filter.projectId = new ObjectId(projectId);
    const list = await ProjectUpdate.find(filter).sort({ createdAt: -1 }).lean().exec();
    return res.json(list);
  } catch (error) { logger.error('listProjectUpdates', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createProjectUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, percentComplete, notes, photos } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const payload: any = {
      projectId: new ObjectId(projectId),
      authorId: req.user?.id ? new ObjectId(req.user.id) : undefined,
      percentComplete: typeof percentComplete === 'number' ? percentComplete : undefined,
      notes: notes || '',
      photos: Array.isArray(photos) ? photos.map((p: any) => (ObjectId.isValid(p) ? new ObjectId(p) : undefined)).filter(Boolean) : [],
    };
    const created = await ProjectUpdate.create(payload as any);
    await logAction(req.user?.id, 'PROJECT_UPDATE_CREATED', `ProjectUpdate ${created._id} created for ${projectId}`);
    return res.status(201).json(created);
  } catch (error) { logger.error('createProjectUpdate', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createSiteVisit(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, visitDate, geoLocation, issues, photos, notes } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const payload: any = {
      projectId: new ObjectId(projectId),
      inspectorId: req.user?.inspectionTeamId ? new ObjectId(req.user.inspectionTeamId) : (req.user?.id ? new ObjectId(req.user.id) : undefined),
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      geoLocation: geoLocation && typeof geoLocation.lat === 'number' && typeof geoLocation.lng === 'number' ? geoLocation : undefined,
      issues: Array.isArray(issues) ? issues : [],
      photos: Array.isArray(photos) ? photos.map((p: any) => (ObjectId.isValid(p) ? new ObjectId(p) : undefined)).filter(Boolean) : [],
      notes: notes || '',
    };
    const created = await SiteVisitReport.create(payload as any);
    await logAction(req.user?.id, 'SITE_VISIT_CREATED', `SiteVisit ${created._id} created for ${projectId}`);
    return res.status(201).json(created);
  } catch (error) { logger.error('createSiteVisit', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function listSiteVisits(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.query as any;
    const filter: any = {};
    if (projectId && ObjectId.isValid(projectId)) filter.projectId = new ObjectId(projectId);
    const list = await SiteVisitReport.find(filter).sort({ visitDate: -1 }).lean().exec();
    return res.json(list);
  } catch (error) { logger.error('listSiteVisits', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function flagDelay(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; const { reason } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid project id' });
    const created = await ProjectUpdate.create({ projectId: new ObjectId(id), authorId: req.user?.id ? new ObjectId(req.user.id) : undefined, notes: reason || 'Delayed', percentComplete: undefined });
    await logAction(req.user?.id, 'PROJECT_DELAY_FLAGGED', `Project ${id} flagged delayed: ${reason || ''}`);
    return res.status(201).json(created);
  } catch (error) { logger.error('flagDelay', error); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function recordQualityCheck(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; const { score, notes } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid project id' });
    const created = await ProjectUpdate.create({ projectId: new ObjectId(id), authorId: req.user?.id ? new ObjectId(req.user.id) : undefined, notes: notes || '', percentComplete: undefined });
    await logAction(req.user?.id, 'QUALITY_CHECK', `Project ${id} quality check score=${score || 'n/a'}`);
    return res.status(201).json({ created, score });
  } catch (error) { logger.error('recordQualityCheck', error); return res.status(500).json({ error: 'Internal server error' }); }
}
