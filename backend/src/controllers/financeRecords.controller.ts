import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth';
import { FinanceProject } from '../models/FinanceProject';
import { FinanceMaterial, FinanceLabour } from '../models/FinanceLedger';
import { FinanceDailyLog, FinanceClientPayment, FinanceDiaryNote } from '../models/FinanceRecords';

const { ObjectId } = mongoose.Types;

async function assertProject(req: AuthenticatedRequest, projectId: string) {
  return FinanceProject.findOne({
    _id: projectId,
    contractorId: new ObjectId(String(req.user?.contractorId)),
    deletedAt: null,
  })
    .lean()
    .exec();
}

function scope(req: AuthenticatedRequest) {
  return new ObjectId(String(req.user?.contractorId));
}

// --- Daily logs -----------------------------------------------------------

export async function listDailyLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const logs = await FinanceDailyLog.find({
      financeProjectId: project._id,
      deletedAt: null,
    })
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();

    return res.json(logs);
  } catch (error) {
    logger.error('listDailyLogs', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createDailyLog(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { date, workDone, workers, labourCost, materialCost, mode, poNumber, notes, photos } =
      req.body as any;

    if (!workDone || !String(workDone).trim()) {
      return res.status(400).json({ error: 'Describe the work done' });
    }

    const log = await FinanceDailyLog.create({
      financeProjectId: project._id,
      contractorId: scope(req),
      date: date ? new Date(date) : new Date(),
      workDone: String(workDone).trim(),
      workers: Math.max(0, Number(workers || 0)),
      labourCost: Math.max(0, Number(labourCost || 0)),
      materialCost: Math.max(0, Number(materialCost || 0)),
      mode: mode || '',
      poNumber: poNumber || '',
      notes: notes || '',
      photos: Array.isArray(photos) ? photos.filter(Boolean) : [],
    });

    return res.status(201).json(log);
  } catch (error) {
    logger.error('createDailyLog', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateDailyLog(req: AuthenticatedRequest, res: Response) {
  try {
    const editable = [
      'date',
      'workDone',
      'workers',
      'labourCost',
      'materialCost',
      'mode',
      'poNumber',
      'notes',
      'photos',
    ];

    const updates: any = {};
    editable.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const log = await FinanceDailyLog.findOneAndUpdate(
      { _id: req.params.id, contractorId: scope(req) },
      updates,
      { new: true }
    ).exec();

    if (!log) return res.status(404).json({ error: 'Log not found' });

    return res.json(log);
  } catch (error) {
    logger.error('updateDailyLog', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteDailyLog(req: AuthenticatedRequest, res: Response) {
  try {
    const log = await FinanceDailyLog.findOneAndUpdate(
      { _id: req.params.id, contractorId: scope(req) },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!log) return res.status(404).json({ error: 'Log not found' });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteDailyLog', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Client payments ------------------------------------------------------

export async function listClientPayments(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const payments = await FinanceClientPayment.find({ financeProjectId: project._id })
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();

    return res.json(payments);
  } catch (error) {
    logger.error('listClientPayments', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createClientPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const amount = Math.max(0, Number((req.body as any).amount || 0));
    if (amount <= 0) return res.status(400).json({ error: 'Enter the amount received' });

    const payment = await FinanceClientPayment.create({
      financeProjectId: project._id,
      contractorId: scope(req),
      date: (req.body as any).date ? new Date((req.body as any).date) : new Date(),
      amount,
      mode: (req.body as any).mode || '',
      note: (req.body as any).note || '',
    });

    return res.status(201).json(payment);
  } catch (error) {
    logger.error('createClientPayment', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteClientPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const payment = await FinanceClientPayment.findOneAndDelete({
      _id: req.params.id,
      contractorId: scope(req),
    }).exec();

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteClientPayment', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// --- P&L ------------------------------------------------------------------

/** Totals for one project's ledger. */
async function ledgerTotals(model: any, financeProjectId: any) {
  const [row] = await model.aggregate([
    { $match: { financeProjectId, deletedAt: null } },
    { $group: { _id: null, budget: { $sum: '$budget' }, paid: { $sum: '$paid' } } },
  ]);

  return { budget: Number(row?.budget || 0), paid: Number(row?.paid || 0) };
}

/**
 * The number the whole module exists for: contract value against what has
 * actually been spent and received.
 */
export async function getProjectPnl(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [material, labour, receivedRow] = await Promise.all([
      ledgerTotals(FinanceMaterial, project._id),
      ledgerTotals(FinanceLabour, project._id),
      FinanceClientPayment.aggregate([
        { $match: { financeProjectId: project._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const contractValue = Number((project as any).contractValue || 0);
    const received = Number(receivedRow?.[0]?.total || 0);
    const spent = material.paid + labour.paid;

    return res.json({
      contractValue,
      received,
      outstanding: Math.max(0, contractValue - received),

      material,
      labour,

      spent,
      grossProfit: contractValue - spent,

      // Guard against a project with no contract value yet: a percentage of
      // zero is meaningless, and dividing by it is worse.
      spendPercent: contractValue > 0 ? Math.round((spent / contractValue) * 100) : null,
    });
  } catch (error) {
    logger.error('getProjectPnl', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Site diary -----------------------------------------------------------

export async function listDiaryNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const notes = await FinanceDiaryNote.find({ financeProjectId: project._id })
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();

    return res.json(notes);
  } catch (error) {
    logger.error('listDiaryNotes', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createDiaryNote(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await assertProject(req, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const note = String((req.body as any).note || '').trim();
    if (!note) return res.status(400).json({ error: 'Write something first' });

    const created = await FinanceDiaryNote.create({
      financeProjectId: project._id,
      contractorId: scope(req),
      date: (req.body as any).date ? new Date((req.body as any).date) : new Date(),
      note,
    });

    return res.status(201).json(created);
  } catch (error) {
    logger.error('createDiaryNote', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteDiaryNote(req: AuthenticatedRequest, res: Response) {
  try {
    const note = await FinanceDiaryNote.findOneAndDelete({
      _id: req.params.id,
      contractorId: scope(req),
    }).exec();

    if (!note) return res.status(404).json({ error: 'Note not found' });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteDiaryNote', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
