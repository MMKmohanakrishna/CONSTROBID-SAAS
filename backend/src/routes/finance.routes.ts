import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { requireContractor, requireActiveSubscription } from '../middlewares/financeAccess';
import uploader from '../middleware/upload';
import {
  listDailyLogs,
  createDailyLog,
  updateDailyLog,
  deleteDailyLog,
  listClientPayments,
  createClientPayment,
  deleteClientPayment,
  getProjectPnl,
  listDiaryNotes,
  createDiaryNote,
  deleteDiaryNote,
} from '../controllers/financeRecords.controller';
import {
  listLedger,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  addLedgerUpdate,
  deleteLedgerUpdate,
  attachFinanceFiles,
  deleteFinanceFile,
} from '../controllers/financeLedger.controller';
import {
  getFinanceOverview,
  listLinkableProjects,
  listFinanceProjects,
  getFinanceProject,
  createFinanceProject,
  updateFinanceProject,
  deleteFinanceProject,
  restoreFinanceProject,
  getFinanceSubscription,
  createFinanceSubscriptionOrder,
  verifyFinanceSubscriptionPayment,
} from '../controllers/finance.controller';

const router = express.Router();

// Everything here belongs to one contractor, always.
router.use(authenticateToken as any);
router.use(requireContractor as any);

// Reads stay open in every subscription state: an expired contractor keeps
// full sight of their own data.
router.get('/overview', getFinanceOverview as any);
router.get('/projects', listFinanceProjects as any);
router.get('/projects/linkable', listLinkableProjects as any);
router.get('/projects/:id', getFinanceProject as any);

router.get('/subscription', getFinanceSubscription as any);
router.post('/subscription/order', createFinanceSubscriptionOrder as any);
router.post('/subscription/verify', verifyFinanceSubscriptionPayment as any);

// Writes require an active trial or subscription.
router.post('/projects', requireActiveSubscription as any, createFinanceProject as any);
router.put('/projects/:id', requireActiveSubscription as any, updateFinanceProject as any);
router.delete('/projects/:id', requireActiveSubscription as any, deleteFinanceProject as any);
router.post('/projects/:id/restore', requireActiveSubscription as any, restoreFinanceProject as any);

// --- Materials and Labour -------------------------------------------------
// Same handlers, different collection: a labour crew is a material ledger with
// different labels.
(['material', 'labour'] as const).forEach((kind) => {
  const plural = kind === 'material' ? 'materials' : 'labour';

  router.get(`/projects/:projectId/${plural}`, listLedger(kind) as any);

  router.post(
    `/projects/:projectId/${plural}`,
    requireActiveSubscription as any,
    createLedgerEntry(kind) as any
  );

  router.put(`/${plural}/:id`, requireActiveSubscription as any, updateLedgerEntry(kind) as any);
  router.delete(`/${plural}/:id`, requireActiveSubscription as any, deleteLedgerEntry(kind) as any);

  router.post(
    `/${plural}/:id/updates`,
    requireActiveSubscription as any,
    addLedgerUpdate(kind) as any
  );

  router.delete(
    `/${plural}/:id/updates/:updateId`,
    requireActiveSubscription as any,
    deleteLedgerUpdate(kind) as any
  );
});

// --- Daily logs -----------------------------------------------------------
router.get('/projects/:projectId/logs', listDailyLogs as any);
router.post('/projects/:projectId/logs', requireActiveSubscription as any, createDailyLog as any);
router.put('/logs/:id', requireActiveSubscription as any, updateDailyLog as any);
router.delete('/logs/:id', requireActiveSubscription as any, deleteDailyLog as any);

// --- Client payments ------------------------------------------------------
router.get('/projects/:projectId/payments', listClientPayments as any);
router.post('/projects/:projectId/payments', requireActiveSubscription as any, createClientPayment as any);
router.delete('/payments/:id', requireActiveSubscription as any, deleteClientPayment as any);

// --- Site diary -----------------------------------------------------------
// Private to the contractor: never exposed through the inspector routes.
router.get('/projects/:projectId/diary', listDiaryNotes as any);
router.post('/projects/:projectId/diary', requireActiveSubscription as any, createDiaryNote as any);
router.delete('/diary/:id', requireActiveSubscription as any, deleteDiaryNote as any);

// --- P&L ------------------------------------------------------------------
router.get('/projects/:projectId/pnl', getProjectPnl as any);

// --- Attachments ----------------------------------------------------------
router.post(
  '/files',
  requireActiveSubscription as any,
  uploader.array('images', 10),
  attachFinanceFiles as any
);

router.delete('/files/:id', requireActiveSubscription as any, deleteFinanceFile as any);

export default router;
