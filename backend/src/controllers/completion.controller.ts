import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth';
import { CompletionRequest, PunchList, CompletionVerification, HandoverCertificate, AuditLog } from '../models';
import logger from '../utils/logger';

const { ObjectId } = mongoose.Types;

async function logAction(userId: any, action: string, details: string) {
  try { await AuditLog.create({ action, details, userId }); } catch (e) { logger.warn('AuditLog error', e); }
}

export async function createCompletionRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, notes, attachments, requestedDocuments } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const contractorId = req.user?.contractorId ? new ObjectId(req.user.contractorId) : undefined;
    const created = await CompletionRequest.create({ projectId: new ObjectId(projectId), contractorId, notes: notes || '', attachments: Array.isArray(attachments) ? attachments : [], requestedDocuments: Array.isArray(requestedDocuments) ? requestedDocuments : [] });
    await logAction(req.user?.id, 'COMPLETION_REQUEST_CREATED', `CompletionRequest ${created._id} for project ${projectId}`);
    return res.status(201).json(created);
  } catch (err) { logger.error('createCompletionRequest', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function listCompletionRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, status } = req.query as any;
    const filter: any = {};
    if (projectId && ObjectId.isValid(projectId)) filter.projectId = new ObjectId(projectId);
    if (status) filter.status = status;
    const list = await CompletionRequest.find(filter).sort({ requestedAt: -1 }).lean().exec();
    return res.json(list);
  } catch (err) { logger.error('listCompletionRequests', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getCompletionRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const r = await CompletionRequest.findById(id).lean().exec();
    return res.json(r);
  } catch (err) { logger.error('getCompletionRequest', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function updateCompletionRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; const { status, inspectionScheduledAt } = req.body as any;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const update: any = {};
    if (status) update.status = status;
    if (inspectionScheduledAt) update.inspectionScheduledAt = new Date(inspectionScheduledAt);
    const updated = await CompletionRequest.findByIdAndUpdate(id, update, { new: true }).lean().exec();
    await logAction(req.user?.id, 'COMPLETION_REQUEST_UPDATED', `CompletionRequest ${id} updated`);
    return res.json(updated);
  } catch (err) { logger.error('updateCompletionRequest', err); return res.status(500).json({ error: 'Internal server error' }); }
}

// PunchList
export async function createPunchList(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, items } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const created = await PunchList.create({ projectId: new ObjectId(projectId), createdBy: req.user?.id ? new ObjectId(req.user.id) : undefined, items: Array.isArray(items) ? items : [] });
    await logAction(req.user?.id, 'PUNCHLIST_CREATED', `PunchList ${created._id} for project ${projectId}`);
    return res.status(201).json(created);
  } catch (err) { logger.error('createPunchList', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getPunchList(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.query as any;
    const filter: any = {};
    if (projectId && ObjectId.isValid(projectId)) filter.projectId = new ObjectId(projectId);
    const list = await PunchList.find(filter).sort({ createdAt: -1 }).lean().exec();
    return res.json(list);
  } catch (err) { logger.error('getPunchList', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function updatePunchItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, itemId } = req.params; const { status, assignedTo, resolvedAt } = req.body as any;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid punchlist id' });
    const pl = await PunchList.findById(id).exec(); if (!pl) return res.status(404).json({ error: 'Not found' });
    // find subdocument by its _id
    const item = (pl.items as any[]).find((it:any) => String(it._id) === String(itemId));
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (status) item.status = status; if (assignedTo && ObjectId.isValid(assignedTo)) item.assignedTo = new ObjectId(assignedTo); if (resolvedAt) item.resolvedAt = new Date(resolvedAt);
    await pl.save(); await logAction(req.user?.id, 'PUNCHLIST_ITEM_UPDATED', `PunchList ${id} item ${itemId} updated`);
    return res.json(pl);
  } catch (err) { logger.error('updatePunchItem', err); return res.status(500).json({ error: 'Internal server error' }); }
}

// Completion Verification
export async function createVerification(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, relatedPunchListId, outcome, summary, metrics, handoverCertificateId } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const created = await CompletionVerification.create({ projectId: new ObjectId(projectId), inspectorId: req.user?.id ? new ObjectId(req.user.id) : undefined, verificationDate: new Date(), outcome, summary, metrics: metrics || {}, relatedPunchListId: relatedPunchListId && ObjectId.isValid(relatedPunchListId) ? new ObjectId(relatedPunchListId) : undefined, handoverCertificateId: handoverCertificateId && ObjectId.isValid(handoverCertificateId) ? new ObjectId(handoverCertificateId) : undefined });
    await logAction(req.user?.id, 'COMPLETION_VERIFICATION_CREATED', `Verification ${created._id} for project ${projectId}`);
    return res.status(201).json(created);
  } catch (err) { logger.error('createVerification', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function listVerifications(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.query as any; const filter: any = {};
    if (projectId && ObjectId.isValid(projectId)) filter.projectId = new ObjectId(projectId);
    const list = await CompletionVerification.find(filter).sort({ verificationDate: -1 }).lean().exec();
    return res.json(list);
  } catch (err) { logger.error('listVerifications', err); return res.status(500).json({ error: 'Internal server error' }); }
}

// Handover
export async function createHandover(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId, certificateUrl, metadata } = req.body as any;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ error: 'projectId required' });
    const created = await HandoverCertificate.create({ projectId: new ObjectId(projectId), issuedBy: req.user?.id ? new ObjectId(req.user.id) : undefined, certificateUrl: certificateUrl || '', metadata: metadata || {} });
    await logAction(req.user?.id, 'HANDOVER_CREATED', `Handover ${created._id} for project ${projectId}`);
    return res.status(201).json(created);
  } catch (err) { logger.error('createHandover', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function signHandover(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; const { role, name } = req.body as any;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const h = await HandoverCertificate.findById(id).exec(); if (!h) return res.status(404).json({ error: 'Not found' });
    h.signatures = h.signatures || [];
    h.signatures.push({ role: role || String(req.user?.role || 'UNKNOWN'), name: name || req.user?.email || 'Unknown', signedAt: new Date() } as any);
    h.status = 'SIGNED';
    await h.save(); await logAction(req.user?.id, 'HANDOVER_SIGNED', `Handover ${id} signed by ${name || req.user?.email}`);
    return res.json(h);
  } catch (err) { logger.error('signHandover', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getHandover(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const h = await HandoverCertificate.findById(id).lean().exec(); return res.json(h);
  } catch (err) { logger.error('getHandover', err); return res.status(500).json({ error: 'Internal server error' }); }
}
