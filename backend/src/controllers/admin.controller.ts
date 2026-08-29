import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendEmail } from '../config/mailer';
import { Client, Contractor, InspectionTeam, User, EmailTemplate, AuditLog, Quotation, Dispute } from '../models';
import logger from '../utils/logger';

// Local enum stand-ins for Prisma enums during migration
export enum Role {
  CLIENT = 'CLIENT',
  CONTRACTOR = 'CONTRACTOR',
  INSPECTION_TEAM = 'INSPECTION_TEAM',
  ADMIN = 'ADMIN',
}

export enum ContractorStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}
// GET USER DIRECTORY
export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const clients = await Client.find().populate({ path: 'userId', select: 'email' }).lean().exec();
    const contractors = await Contractor.find().populate({ path: 'userId', select: 'email' }).lean().exec();
    const inspectors = await InspectionTeam.find().populate({ path: 'userId', select: 'email' }).lean().exec();

    return res.json({ clients, contractors, inspectors });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// UPDATE USER PROFILE OR STATUS (e.g. Verify/suspend contractor, update profile details)
export async function updateUser(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { role, status, name, companyName, experience } = req.body;

  try {
    if (role === Role.CONTRACTOR) {
      const updatedContractor = await Contractor.findByIdAndUpdate(id, { status: status as any, name, companyName, experience: experience ? parseInt(experience, 10) : undefined }, { new: true }).populate({ path: 'userId', select: 'email' }).lean().exec();

      if (status === ContractorStatus.VERIFIED) {
        const email = (updatedContractor as any)?.userId?.email;
        if (email) {
          await sendEmail({ to: email, templateType: 'CONTRACTOR_APPROVAL', context: { companyName: (updatedContractor as any)?.companyName || '' } });
        }

        await AuditLog.create({ action: 'CONTRACTOR_VERIFIED', details: `Contractor profile ${id} verified.`, userId: req.user?.id });
      }

      return res.json(updatedContractor);
    }

    if (role === Role.CLIENT) {
      const updatedClient = await Client.findByIdAndUpdate(id, { name, phone: req.body.phone, address: req.body.address, city: req.body.city }, { new: true }).lean().exec();
      return res.json(updatedClient);
    }

    return res.status(400).json({ error: 'Invalid update parameters' });
  } catch (error) {
    logger.error('updateUser', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE/SUSPEND USER
export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  const { userId } = req.params;

  try {
    await User.findByIdAndDelete(userId).exec();
    await AuditLog.create({ action: 'USER_DELETED', details: `Deleted user account ${userId}`, userId: req.user?.id });
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// REVENUE / COMMISSIONS TRACKING
export async function getRevenueDetails(req: AuthenticatedRequest, res: Response) {
  try {
    // commissionSetting stored in a simple collection since Prisma was removed
    const cs = await mongoose.connection.collection('commissionsettings').findOne({ _id: 'default' } as any) as any;
    const commissionPercent = (cs && cs.commissionPercent) ? cs.commissionPercent : 10.0;

    // Fetch selected quotations with populated project and contractor
    const selectedBids = await Quotation.find({ selected: true }).populate('projectId').populate('contractorId').lean().exec();

    let totalProjectRevenue = 0;
    let totalCommissionsEarned = 0;

    const projectsRevenueList = (selectedBids as any[]).map((bid: any) => {
      const bidRevenue = bid.cost;
      const commissionEarned = (bidRevenue * commissionPercent) / 100;

      totalProjectRevenue += bidRevenue;
      totalCommissionsEarned += commissionEarned;

      return {
        projectId: bid.projectId,
        projectTitle: (bid.projectId as any)?.title || (bid.project as any)?.title,
        status: (bid.projectId as any)?.status || (bid.project as any)?.status,
        contractorName: (bid.contractorId as any)?.companyName || (bid.contractor as any)?.companyName,
        bidCost: bidRevenue,
        commissionEarned,
      };
    });

    // Count disputes
    const openDisputesCount = await Dispute.countDocuments({ status: 'OPEN' }).exec();

    return res.json({
      commissionPercent,
      totalProjectRevenue,
      totalCommissionsEarned,
      openDisputesCount,
      projects: projectsRevenueList,
    });
  } catch (error) {
    logger.error('getRevenueDetails', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// UPDATE COMMISSION CONFIG
export async function updateCommissionConfig(req: AuthenticatedRequest, res: Response) {
  const { commissionPercent } = req.body;
  if (commissionPercent === undefined) {
    return res.status(400).json({ error: 'Commission percent is required' });
  }

  try {
    const col = mongoose.connection.collection('commissionsettings');
    await col.updateOne({ _id: 'default' } as any, { $set: { commissionPercent: parseFloat(commissionPercent) } }, { upsert: true });
    const updated = await col.findOne({ _id: 'default' } as any) as any;
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET AUDIT LOGS
export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).populate({ path: 'userId', select: 'email role' }).lean().exec();
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET EMAIL TEMPLATES LIST
export async function getEmailTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const templates = await EmailTemplate.find().lean().exec();
    return res.json(templates);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// UPDATE EMAIL TEMPLATE
export async function updateEmailTemplate(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { subject, body } = req.body;

  try {
    const updated = await EmailTemplate.findByIdAndUpdate(id, { subject, body }, { new: true }).lean().exec();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// RESOLVE DISPUTE
export async function resolveDispute(req: AuthenticatedRequest, res: Response) {
  const { disputeId } = req.params;
  const { resolutionNotes, newStatus } = req.body;

  try {
    const updated = await Dispute.findByIdAndUpdate(disputeId, { status: newStatus, resolutionNotes }, { new: true }).lean().exec();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
