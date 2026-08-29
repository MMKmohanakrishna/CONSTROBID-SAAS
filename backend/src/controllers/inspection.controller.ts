import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Contractor, AuditLog, User, Project } from '../models';
import { sendEmail } from '../config/mailer';
import logger from '../utils/logger';

// GET /inspection/contractors?status=...
export async function getContractors(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    logger.info('getContractors called', { filter, user: req.user ? { id: req.user.id, role: req.user.role } : null });

    const contractors = await Contractor.find(filter).populate({ path: 'userId', select: 'email' }).sort({ createdAt: -1 }).lean().exec();
    return res.json(contractors);
  } catch (error) {
    logger.error('getContractors', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /inspection/contractors/:id
export async function getContractorById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const contractor = await Contractor.findById(id).populate({ path: 'userId', select: 'email' }).lean().exec();
    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });
    const contractorId = id;

const relatedProjects = await Project.find({
  $or: [
    { contractorId: contractorId },
    { selectedContractor: contractorId },
  ],
})
.populate({
  path: "clientId",
  select: "name phone city",
})
.sort({ createdAt: -1 })
.lean();
console.log(relatedProjects);
    return res.json({
  contractor,

  performance: {
    projectsCompleted: 0,
    averageRating: 0,
    completionRate: 0,
    disputes: 0,
    cancelledProjects: 0,
    onTimeDelivery: 0,
  },

  inspectorNotes: "",

  relatedProjects,
});
  } catch (error) {
    logger.error('getContractorById', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/contractors/:id/approve
export async function approveContractor(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const updated = await Contractor.findByIdAndUpdate(id, { status: 'VERIFIED' }, { new: true }).populate({ path: 'userId', select: 'email' }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Contractor not found' });

    // send approval email
    const email = (updated as any)?.userId?.email;
    if (email) {
      await sendEmail({ to: email, templateType: 'CONTRACTOR_APPROVAL', context: { companyName: (updated as any)?.companyName || '', ownerName: (updated as any)?.name || '' } });
    }

    await AuditLog.create({ action: 'CONTRACTOR_APPROVED', details: `Contractor ${id} approved`, userId: req.user?.id });

    return res.json(updated);
  } catch (error) {
    logger.error('approveContractor', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/contractors/:id/reject
export async function rejectContractor(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await Contractor.findByIdAndUpdate(id, { status: 'REJECTED' }, { new: true }).populate({ path: 'userId', select: 'email' }).lean().exec();
    if (!updated) return res.status(404).json({ error: 'Contractor not found' });

    const email = (updated as any)?.userId?.email;
    if (email) {
      await sendEmail({ to: email, templateType: 'CONTRACTOR_REJECTION', context: { companyName: (updated as any)?.companyName || '', reason: reason || 'Application rejected' } });
    }

    await AuditLog.create({ action: 'CONTRACTOR_REJECTED', details: `Contractor ${id} rejected. Reason: ${reason || 'N/A'}`, userId: req.user?.id });

    return res.json(updated);
  } catch (error) {
    logger.error('rejectContractor', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/contractors/:id/request-documents
export async function requestDocuments(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { message } = req.body;
  try {
    const contractor = await Contractor.findById(id)
  .populate({
    path: "userId",
    select: "email name profileImage createdAt",
  })
  .lean()
  .exec();
    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });

    const email = (contractor as any)?.userId?.email;
    if (email) {
      await sendEmail({ to: email, templateType: 'CONTRACTOR_REQUEST_DOCUMENTS', context: { companyName: (contractor as any)?.companyName || '', message: message || 'Please provide additional documents' } });
    }

    await AuditLog.create({ action: 'CONTRACTOR_DOCUMENTS_REQUESTED', details: `Requested additional docs for contractor ${id}: ${message || ''}`, userId: req.user?.id });

    return res.json({ ok: true });
  } catch (error) {
    logger.error('requestDocuments', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /inspection/contractors/:id/block
export async function blockContractor(
  req: AuthenticatedRequest,
  res: Response
) {
  const { id } = req.params;
  const { reason } = req.body;

  try {

    const updated = await Contractor.findByIdAndUpdate(
  id,
  {
    status: "BLOCKED",
    blockedReason: reason,
    blockedAt: new Date(),
  },
  { new: true }
)
      .populate({
        path: "userId",
        select: "email",
      })
      .lean()
      .exec();

    if (!updated) {
      return res.status(404).json({
        error: "Contractor not found",
      });
    }

    await AuditLog.create({
      action: "CONTRACTOR_BLOCKED",
      details: `Contractor ${id} blocked. Reason: ${reason}`,
      userId: req.user?.id,
    });

    return res.json(updated);

  } catch (error) {

    logger.error("blockContractor", error);

    return res.status(500).json({
      error: "Internal server error",
    });

  }
}