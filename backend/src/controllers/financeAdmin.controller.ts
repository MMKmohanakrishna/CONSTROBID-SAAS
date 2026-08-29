import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Contractor } from '../models';
import { FinanceProject } from '../models/FinanceProject';
import { FinanceMaterial, FinanceLabour } from '../models/FinanceLedger';
import { FinanceDailyLog, FinanceClientPayment } from '../models/FinanceRecords';
import { FinanceSubscription, resolveSubscriptionStatus } from '../models/FinanceSubscription';

/**
 * The inspection team's read-only view over contractor finances.
 *
 * Two rules hold throughout this file:
 *   1. Nothing here writes. Every handler is a GET.
 *   2. The Site Diary is never returned. It is the contractor's private
 *      notebook and carries nothing the inspection team needs.
 */

/** Contractors who have actually used the module, with headline numbers. */
export async function listFinanceContractors(req: AuthenticatedRequest, res: Response) {
  try {
    const grouped = await FinanceProject.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$contractorId',
          projectCount: { $sum: 1 },
          contractValue: { $sum: '$contractValue' },
          lastActivity: { $max: '$updatedAt' },
          platformProjects: {
            $sum: { $cond: [{ $ifNull: ['$sourceProjectId', false] }, 1, 0] },
          },
        },
      },
      { $sort: { lastActivity: -1 } },
    ]);

    if (grouped.length === 0) return res.json([]);

    const contractorIds = grouped.map((row: any) => row._id);

    const [contractors, subscriptions] = await Promise.all([
      Contractor.find({ _id: { $in: contractorIds } })
        .select('name companyName phone city status')
        .lean()
        .exec(),
      FinanceSubscription.find({ contractorId: { $in: contractorIds } }).lean().exec(),
    ]);

    const contractorById = new Map(contractors.map((item: any) => [String(item._id), item]));
    const subscriptionById = new Map(
      subscriptions.map((item: any) => [String(item.contractorId), item])
    );

    return res.json(
      grouped.map((row: any) => {
        const contractor: any = contractorById.get(String(row._id));
        const subscription: any = subscriptionById.get(String(row._id));

        return {
          contractorId: row._id,
          name: contractor?.name || '',
          companyName: contractor?.companyName || contractor?.name || 'Contractor',
          phone: contractor?.phone || '',
          city: contractor?.city || '',
          projectCount: row.projectCount,
          platformProjects: row.platformProjects,
          ownProjects: row.projectCount - row.platformProjects,
          contractValue: row.contractValue,
          lastActivity: row.lastActivity,
          subscriptionStatus: resolveSubscriptionStatus(subscription || null),
        };
      })
    );
  } catch (error) {
    logger.error('listFinanceContractors', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** Totals per project, so the list can show spend and profit without N calls. */
async function paidByProject(model: any, projectIds: any[]) {
  const rows = await model.aggregate([
    { $match: { financeProjectId: { $in: projectIds }, deletedAt: null } },
    { $group: { _id: '$financeProjectId', budget: { $sum: '$budget' }, paid: { $sum: '$paid' } } },
  ]);

  return new Map(rows.map((row: any) => [String(row._id), row]));
}

export async function getFinanceContractor(req: AuthenticatedRequest, res: Response) {
  try {
    const contractorId = new mongoose.Types.ObjectId(String(req.params.contractorId));

    const [contractor, subscription, projects] = await Promise.all([
      Contractor.findById(contractorId).select('name companyName phone city status').lean().exec(),
      FinanceSubscription.findOne({ contractorId }).lean().exec(),
      FinanceProject.find({ contractorId, deletedAt: null }).sort({ createdAt: -1 }).lean().exec(),
    ]);

    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });

    const projectIds = projects.map((project: any) => project._id);

    const [materials, labour, receipts] = await Promise.all([
      projectIds.length ? paidByProject(FinanceMaterial, projectIds) : new Map(),
      projectIds.length ? paidByProject(FinanceLabour, projectIds) : new Map(),
      projectIds.length
        ? FinanceClientPayment.aggregate([
            { $match: { financeProjectId: { $in: projectIds } } },
            { $group: { _id: '$financeProjectId', total: { $sum: '$amount' } } },
          ])
        : [],
    ]);

    const receivedById = new Map(
      (receipts as any[]).map((row: any) => [String(row._id), Number(row.total || 0)])
    );

    return res.json({
      contractor: {
        ...contractor,
        subscriptionStatus: resolveSubscriptionStatus((subscription as any) || null),
        trialEndsAt: (subscription as any)?.trialEndsAt || null,
        validUntil: (subscription as any)?.validUntil || null,
      },
      projects: projects.map((project: any) => {
        const materialPaid = Number((materials.get(String(project._id)) as any)?.paid || 0);
        const labourPaid = Number((labour.get(String(project._id)) as any)?.paid || 0);
        const spent = materialPaid + labourPaid;

        return {
          ...project,
          spent,
          received: receivedById.get(String(project._id)) || 0,
          grossProfit: Number(project.contractValue || 0) - spent,
        };
      }),
    });
  } catch (error) {
    logger.error('getFinanceContractor', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/** One project in full — everything except the diary. */
export async function getFinanceProjectForInspector(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await FinanceProject.findById(req.params.projectId).lean().exec();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [contractor, materials, labour, logs, payments] = await Promise.all([
      Contractor.findById((project as any).contractorId)
        .select('name companyName phone city')
        .lean()
        .exec(),
      FinanceMaterial.find({ financeProjectId: project._id, deletedAt: null })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      FinanceLabour.find({ financeProjectId: project._id, deletedAt: null })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      FinanceDailyLog.find({ financeProjectId: project._id, deletedAt: null })
        .sort({ date: -1 })
        .lean()
        .exec(),
      FinanceClientPayment.find({ financeProjectId: project._id })
        .sort({ date: -1 })
        .lean()
        .exec(),
    ]);

    const sum = (rows: any[], field: string) =>
      rows.reduce((total, row) => total + Number(row[field] || 0), 0);

    const materialTotals = { budget: sum(materials, 'budget'), paid: sum(materials, 'paid') };
    const labourTotals = { budget: sum(labour, 'budget'), paid: sum(labour, 'paid') };
    const received = sum(payments, 'amount');
    const spent = materialTotals.paid + labourTotals.paid;
    const contractValue = Number((project as any).contractValue || 0);

    return res.json({
      project,
      contractor,
      materials,
      labour,
      logs,
      payments,
      pnl: {
        contractValue,
        received,
        outstanding: Math.max(0, contractValue - received),
        material: materialTotals,
        labour: labourTotals,
        spent,
        grossProfit: contractValue - spent,
        spendPercent: contractValue > 0 ? Math.round((spent / contractValue) * 100) : null,
      },
    });
  } catch (error) {
    logger.error('getFinanceProjectForInspector', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
