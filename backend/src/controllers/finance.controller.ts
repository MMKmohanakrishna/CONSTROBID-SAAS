import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth';
import { getOrStartSubscription } from '../middlewares/financeAccess';
import { Project, Quotation, Contractor, User, Payment } from '../models';
import { FinanceProject } from '../models/FinanceProject';
import { FinanceMaterial, FinanceLabour } from '../models/FinanceLedger';
import { FinanceClientPayment } from '../models/FinanceRecords';
import {
  FinanceSubscription,
  FINANCE_PLAN_AMOUNT_PAISE,
  resolveSubscriptionStatus,
} from '../models/FinanceSubscription';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from '../config/razorpay';

const { ObjectId } = mongoose.Types;

/** Statuses where the contractor has actually won the job and can track its money. */
const WON_PROJECT_STATUSES = [
  'CONTRACTOR_CONFIRMED',
  'WORK_STARTED',
  'IN_PROGRESS',
  'COMPLETION_VERIFICATION',
  'READY_FOR_HANDOVER',
  'PROJECT_COMPLETED',
];

function contractorScope(req: AuthenticatedRequest) {
  return { contractorId: new ObjectId(String(req.user?.contractorId)) };
}

async function subscriptionPayload(req: AuthenticatedRequest) {
  const subscription = await getOrStartSubscription(
    String(req.user?.contractorId),
    req.user?.id
  );

  const status = resolveSubscriptionStatus(subscription);

  const daysLeft =
    status === 'trialing'
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

  return {
    status,
    trialEndsAt: subscription.trialEndsAt,
    validUntil: subscription.validUntil,
    trialDaysLeft: daysLeft,
    amount: FINANCE_PLAN_AMOUNT_PAISE,
    currency: 'INR',
    canWrite: status !== 'expired',
    configured: isRazorpayConfigured(),
  };
}

/** Budget and paid per project, for one ledger. */
async function ledgerByProject(model: any, projectIds: any[]) {
  const totals = new Map<string, { budget: number; paid: number }>();
  if (projectIds.length === 0) return totals;

  const rows = await model.aggregate([
    { $match: { financeProjectId: { $in: projectIds }, deletedAt: null } },
    {
      $group: {
        _id: '$financeProjectId',
        budget: { $sum: '$budget' },
        paid: { $sum: '$paid' },
      },
    },
  ]);

  rows.forEach((row: any) => {
    totals.set(String(row._id), {
      budget: Number(row.budget || 0),
      paid: Number(row.paid || 0),
    });
  });

  return totals;
}

/** Client receipts per project. */
async function receivedByProject(projectIds: any[]) {
  const totals = new Map<string, number>();
  if (projectIds.length === 0) return totals;

  const rows = await FinanceClientPayment.aggregate([
    { $match: { financeProjectId: { $in: projectIds } } },
    { $group: { _id: '$financeProjectId', total: { $sum: '$amount' } } },
  ]);

  rows.forEach((row: any) => totals.set(String(row._id), Number(row.total || 0)));

  return totals;
}

/**
 * Everything the finance dashboard needs in one call: subscription state,
 * headline totals, the project list, and any ConstroBID jobs not yet tracked.
 */
export async function getFinanceOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const scope = contractorScope(req);

    const rows = await FinanceProject.find({ ...scope, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const projectIds = rows.map((project: any) => project._id);

    // One pass per collection, keyed by project, so the list can show spend
    // and profit per row without a request each.
    const [materials, labour, receipts] = await Promise.all([
      ledgerByProject(FinanceMaterial, projectIds),
      ledgerByProject(FinanceLabour, projectIds),
      receivedByProject(projectIds),
    ]);

    const projects = rows.map((project: any) => {
      const key = String(project._id);
      const material = materials.get(key) || { budget: 0, paid: 0 };
      const crew = labour.get(key) || { budget: 0, paid: 0 };

      const spent = material.paid + crew.paid;
      const received = receipts.get(key) || 0;
      const contractValue = Number(project.contractValue || 0);

      return {
        ...project,
        spent,
        received,
        grossProfit: contractValue - spent,

        // What the client still owes, and what suppliers and crews are still
        // owed. Both are what a contractor is actually chased about.
        owedToMe: Math.max(0, contractValue - received),
        owedByMe: Math.max(0, material.budget + crew.budget - spent),
      };
    });

    const sum = (field: string) =>
      projects.reduce((total: number, project: any) => total + Number(project[field] || 0), 0);

    const materialSpend = [...materials.values()].reduce((total, row) => total + row.paid, 0);
    const labourSpend = [...labour.values()].reduce((total, row) => total + row.paid, 0);

    const summary = {
      projectCount: projects.length,
      contractValue: sum('contractValue'),
      spent: materialSpend + labourSpend,
      materialSpend,
      labourSpend,
      received: sum('received'),
      owedToMe: sum('owedToMe'),
      owedByMe: sum('owedByMe'),
    };

    return res.json({
      subscription: await subscriptionPayload(req),
      summary,
      projects,
      linkable: await findLinkableProjects(req),
    });
  } catch (error) {
    logger.error('getFinanceOverview', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * ConstroBID jobs this contractor has won but is not tracking yet. Offered as a
 * prompt rather than created automatically — the contractor decides what they
 * want in their own books.
 */
async function findLinkableProjects(req: AuthenticatedRequest) {
  const contractorId = new ObjectId(String(req.user?.contractorId));

  const won = await Project.find({
    $or: [{ contractorId }, { selectedContractor: contractorId }],
    status: { $in: WON_PROJECT_STATUSES },
  })
    .select('title city status budget clientId')
    .populate({ path: 'clientId', select: 'name' })
    .lean()
    .exec();

  if (won.length === 0) return [];

  const tracked = await FinanceProject.find({
    contractorId,
    sourceProjectId: { $in: won.map((project: any) => project._id) },
  })
    .select('sourceProjectId')
    .lean()
    .exec();

  const trackedIds = new Set(tracked.map((item: any) => String(item.sourceProjectId)));

  return won
    .filter((project: any) => !trackedIds.has(String(project._id)))
    .map((project: any) => ({
      _id: project._id,
      title: project.title,
      city: project.city,
      status: project.status,
      clientName: (project.clientId as any)?.name || '',
    }));
}

export async function listLinkableProjects(req: AuthenticatedRequest, res: Response) {
  try {
    return res.json(await findLinkableProjects(req));
  } catch (error) {
    logger.error('listLinkableProjects', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listFinanceProjects(req: AuthenticatedRequest, res: Response) {
  try {
    const includeDeleted = String(req.query.deleted || '') === 'true';

    const projects = await FinanceProject.find({
      ...contractorScope(req),
      deletedAt: includeDeleted ? { $ne: null } : null,
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json(projects);
  } catch (error) {
    logger.error('listFinanceProjects', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFinanceProject(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await FinanceProject.findOne({
      _id: req.params.id,
      ...contractorScope(req),
    })
      .lean()
      .exec();

    if (!project) return res.status(404).json({ error: 'Project not found' });

    return res.json(project);
  } catch (error) {
    logger.error('getFinanceProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFinanceProject(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, clientName, location, contractValue, status, startDate, endDate, notes, sourceProjectId } =
      req.body as any;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const payload: any = {
      ...contractorScope(req),
      name: String(name).trim(),
      clientName: clientName || '',
      location: location || '',
      contractValue: Math.max(0, Number(contractValue || 0)),
      status: status || 'active',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      notes: notes || '',
    };

    // Linking to a ConstroBID job: carry across what the platform already knows,
    // and suggest the accepted quotation total only when it is a real figure.
    if (sourceProjectId && mongoose.Types.ObjectId.isValid(sourceProjectId)) {
      const contractorId = new ObjectId(String(req.user?.contractorId));

      const source = await Project.findOne({
        _id: sourceProjectId,
        $or: [{ contractorId }, { selectedContractor: contractorId }],
      })
        .populate({ path: 'clientId', select: 'name' })
        .lean()
        .exec();

      if (!source) {
        return res.status(403).json({ error: 'That project is not assigned to you' });
      }

      const alreadyTracked = await FinanceProject.findOne({
        contractorId,
        sourceProjectId: source._id,
      })
        .lean()
        .exec();

      if (alreadyTracked) {
        return res.status(409).json({ error: 'This project is already in your finance tracker' });
      }

      const quotation = await Quotation.findOne({
        projectId: source._id,
        contractorId,
      })
        .lean()
        .exec();

      const quoted = Number((quotation as any)?.grandTotal || (quotation as any)?.cost || 0);

      payload.sourceProjectId = source._id;
      payload.name = payload.name || (source as any).title;
      payload.clientName = payload.clientName || ((source as any).clientId as any)?.name || '';
      payload.location = payload.location || (source as any).city || '';

      if (!payload.contractValue && quoted > 0) payload.contractValue = quoted;
    }

    const project = await FinanceProject.create(payload);

    return res.status(201).json(project);
  } catch (error) {
    logger.error('createFinanceProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFinanceProject(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await FinanceProject.findOne({ _id: req.params.id, ...contractorScope(req) }).lean().exec();
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    // A ConstroBID-sourced project's identity comes from the real project
    // record, not the contractor — those three fields stay fixed. Only
    // manually-added outside projects can rename/reassign them.
    const editable = (existing as any).sourceProjectId
      ? ['contractValue', 'status', 'startDate', 'endDate', 'notes']
      : ['name', 'clientName', 'location', 'contractValue', 'status', 'startDate', 'endDate', 'notes'];

    const updates: any = {};
    editable.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.contractValue !== undefined) {
      updates.contractValue = Math.max(0, Number(updates.contractValue || 0));
    }

    const project = await FinanceProject.findOneAndUpdate(
      { _id: req.params.id, ...contractorScope(req) },
      updates,
      { new: true }
    ).exec();

    if (!project) return res.status(404).json({ error: 'Project not found' });

    return res.json(project);
  } catch (error) {
    logger.error('updateFinanceProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFinanceProject(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await FinanceProject.findOneAndUpdate(
      { _id: req.params.id, ...contractorScope(req) },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!project) return res.status(404).json({ error: 'Project not found' });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteFinanceProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function restoreFinanceProject(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await FinanceProject.findOneAndUpdate(
      { _id: req.params.id, ...contractorScope(req) },
      { deletedAt: null },
      { new: true }
    ).exec();

    if (!project) return res.status(404).json({ error: 'Project not found' });

    return res.json(project);
  } catch (error) {
    logger.error('restoreFinanceProject', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFinanceSubscription(req: AuthenticatedRequest, res: Response) {
  try {
    return res.json(await subscriptionPayload(req));
  } catch (error) {
    logger.error('getFinanceSubscription', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFinanceSubscriptionOrder(req: AuthenticatedRequest, res: Response) {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: 'Online payment is not configured. Please contact ConstroBID support.',
      });
    }

    const contractorId = String(req.user?.contractorId);

    const order = await createRazorpayOrder({
      amountInPaise: FINANCE_PLAN_AMOUNT_PAISE,
      receipt: `fin_${contractorId}_${Date.now()}`.slice(0, 40),
      notes: { contractorId, purpose: 'FINANCE_SUBSCRIPTION' },
    });

    await Payment.create({
      userId: new ObjectId(String(req.user?.id)),
      purpose: 'FINANCE_SUBSCRIPTION',
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: 'CREATED',
    });

    const contractor = await Contractor.findById(contractorId).lean().exec();
    const user = await User.findById(req.user?.id).lean().exec();

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      prefill: {
        name: (contractor as any)?.companyName || (contractor as any)?.name || '',
        email: (user as any)?.email || '',
        contact: (contractor as any)?.phone || '',
      },
    });
  } catch (error) {
    logger.error('createFinanceSubscriptionOrder', error);
    return res.status(500).json({ error: 'Unable to start the payment. Please try again.' });
  }
}

export async function verifyFinanceSubscriptionPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as any;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Incomplete payment details' });
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
      userId: new ObjectId(String(req.user?.id)),
      purpose: 'FINANCE_SUBSCRIPTION',
    }).exec();

    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const valid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'PAID';
    await payment.save();

    const subscription = await getOrStartSubscription(
      String(req.user?.contractorId),
      req.user?.id
    );

    // Extend from whichever is later: an unexpired subscription keeps its
    // remaining days rather than losing them on early renewal.
    const base =
      subscription.validUntil && new Date(subscription.validUntil).getTime() > Date.now()
        ? new Date(subscription.validUntil)
        : new Date();

    base.setMonth(base.getMonth() + 1);

    subscription.validUntil = base;
    subscription.lastPaymentId = razorpayPaymentId;
    await subscription.save();

    return res.json({ unlocked: true, subscription: await subscriptionPayload(req) });
  } catch (error) {
    logger.error('verifyFinanceSubscriptionPayment', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
