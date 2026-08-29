import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth';
import { FinanceProject } from '../models/FinanceProject';
import { FinanceFile } from '../models/FinanceFile';
import {
  FinanceMaterial,
  FinanceLabour,
  recalculateLedgerTotals,
} from '../models/FinanceLedger';

const { ObjectId } = mongoose.Types;

type LedgerKind = 'material' | 'labour';

/**
 * Materials and labour are the same ledger with different labels, so one set of
 * handlers serves both. The kind decides the model and which extra fields are
 * accepted.
 */
function modelFor(kind: LedgerKind) {
  return kind === 'material' ? FinanceMaterial : (FinanceLabour as any);
}

const EXTRA_FIELDS: Record<LedgerKind, string[]> = {
  material: ['quantity', 'supplier', 'poNumber'],
  labour: ['trade', 'workers', 'contact'],
};

/** The project must exist, belong to this contractor, and not be in the trash. */
async function assertProject(req: AuthenticatedRequest, projectId: string) {
  return FinanceProject.findOne({
    _id: projectId,
    contractorId: new ObjectId(String(req.user?.contractorId)),
    deletedAt: null,
  })
    .lean()
    .exec();
}

async function attachFiles(entries: any[], kind: LedgerKind) {
  if (entries.length === 0) return entries;

  const entryIds = entries.map((entry) => entry._id);
  const updateIds = entries.flatMap((entry) =>
    (entry.updates || []).map((update: any) => update._id)
  );

  const files = await FinanceFile.find({
    $or: [
      { entityType: kind, entityId: { $in: entryIds } },
      { entityType: `${kind}_update`, entityId: { $in: updateIds } },
    ],
  })
    .lean()
    .exec();

  const byEntity = new Map<string, any[]>();
  files.forEach((file: any) => {
    const key = String(file.entityId);
    byEntity.set(key, [...(byEntity.get(key) || []), file]);
  });

  return entries.map((entry) => ({
    ...entry,
    files: byEntity.get(String(entry._id)) || [],
    updates: (entry.updates || []).map((update: any) => ({
      ...update,
      files: byEntity.get(String(update._id)) || [],
    })),
  }));
}

export function listLedger(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const project = await assertProject(req, req.params.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const entries = await modelFor(kind)
        .find({ financeProjectId: project._id, deletedAt: null })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return res.json(await attachFiles(entries, kind));
    } catch (error) {
      logger.error(`list-${kind}`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function createLedgerEntry(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const project = await assertProject(req, req.params.projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const { name, budget, paid, mode, note } = req.body as any;

      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'A name is required' });
      }

      const payload: any = {
        financeProjectId: project._id,
        contractorId: new ObjectId(String(req.user?.contractorId)),
        name: String(name).trim(),
        openingBudget: Math.max(0, Number(budget || 0)),
        updates: [],
      };

      EXTRA_FIELDS[kind].forEach((field) => {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      });

      // An amount already paid becomes the first entry in the history rather
      // than a bare number, so the totals stay derivable from the updates.
      const openingPaid = Math.max(0, Number(paid || 0));
      if (openingPaid > 0) {
        payload.updates.push({
          date: new Date(),
          paidAdded: openingPaid,
          budgetAdded: 0,
          mode: mode || '',
          note: note || 'Opening entry',
        });
      }

      recalculateLedgerTotals(payload);

      const entry = await modelFor(kind).create(payload);

      return res.status(201).json(entry);
    } catch (error) {
      logger.error(`create-${kind}`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function updateLedgerEntry(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entry = await modelFor(kind)
        .findOne({
          _id: req.params.id,
          contractorId: new ObjectId(String(req.user?.contractorId)),
        })
        .exec();

      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      if (req.body.name !== undefined) entry.name = String(req.body.name).trim();
      if (req.body.budget !== undefined) {
        entry.openingBudget = Math.max(0, Number(req.body.budget || 0));
      }

      EXTRA_FIELDS[kind].forEach((field) => {
        if (req.body[field] !== undefined) (entry as any)[field] = req.body[field];
      });

      recalculateLedgerTotals(entry);
      await entry.save();

      return res.json(entry);
    } catch (error) {
      logger.error(`update-${kind}`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function deleteLedgerEntry(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entry = await modelFor(kind)
        .findOneAndUpdate(
          {
            _id: req.params.id,
            contractorId: new ObjectId(String(req.user?.contractorId)),
          },
          { deletedAt: new Date() },
          { new: true }
        )
        .exec();

      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      return res.json({ success: true });
    } catch (error) {
      logger.error(`delete-${kind}`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function addLedgerUpdate(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entry = await modelFor(kind)
        .findOne({
          _id: req.params.id,
          contractorId: new ObjectId(String(req.user?.contractorId)),
        })
        .exec();

      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      const { date, paidAdded, budgetAdded, mode, note } = req.body as any;

      const paid = Math.max(0, Number(paidAdded || 0));
      const added = Math.max(0, Number(budgetAdded || 0));

      if (paid <= 0 && added <= 0) {
        return res.status(400).json({ error: 'Enter an amount paid or budget added' });
      }

      entry.updates.push({
        date: date ? new Date(date) : new Date(),
        paidAdded: paid,
        budgetAdded: added,
        mode: mode || '',
        note: note || '',
      } as any);

      recalculateLedgerTotals(entry);
      await entry.save();

      return res.status(201).json(entry);
    } catch (error) {
      logger.error(`add-${kind}-update`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function deleteLedgerUpdate(kind: LedgerKind) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const entry = await modelFor(kind)
        .findOne({
          _id: req.params.id,
          contractorId: new ObjectId(String(req.user?.contractorId)),
        })
        .exec();

      if (!entry) return res.status(404).json({ error: 'Entry not found' });

      const before = entry.updates.length;
      entry.updates = entry.updates.filter(
        (update: any) => String(update._id) !== String(req.params.updateId)
      ) as any;

      if (entry.updates.length === before) {
        return res.status(404).json({ error: 'Payment entry not found' });
      }

      recalculateLedgerTotals(entry);
      await entry.save();

      // Any invoice hanging off that payment goes with it.
      await FinanceFile.deleteMany({
        entityType: `${kind}_update`,
        entityId: new ObjectId(String(req.params.updateId)),
      }).exec();

      return res.json(entry);
    } catch (error) {
      logger.error(`delete-${kind}-update`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/** Records files already pushed to Cloudinary by the shared upload middleware. */
export async function attachFinanceFiles(req: AuthenticatedRequest, res: Response) {
  try {
    const { financeProjectId, entityType, entityId } = req.body as any;

    const project = await assertProject(req, financeProjectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const uploaded = ((req as any).files || []) as any[];
    if (uploaded.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const created = await FinanceFile.insertMany(
      uploaded.map((file) => ({
        contractorId: new ObjectId(String(req.user?.contractorId)),
        financeProjectId: project._id,
        entityType,
        entityId: new ObjectId(String(entityId)),
        fileName: file.originalname || 'File',
        fileUrl: file.path || file.secure_url || file.url,
        mimeType: file.mimetype || '',
        sizeBytes: file.size || 0,
      }))
    );

    return res.status(201).json(created);
  } catch (error) {
    logger.error('attachFinanceFiles', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFinanceFile(req: AuthenticatedRequest, res: Response) {
  try {
    const file = await FinanceFile.findOneAndDelete({
      _id: req.params.id,
      contractorId: new ObjectId(String(req.user?.contractorId)),
    }).exec();

    if (!file) return res.status(404).json({ error: 'File not found' });

    return res.json({ success: true });
  } catch (error) {
    logger.error('deleteFinanceFile', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
