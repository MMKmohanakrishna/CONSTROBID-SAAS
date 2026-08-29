import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  getBoqUnlockStatus,
  createBoqUnlockOrder,
  verifyBoqUnlockPayment,
} from '../controllers/payment.controller';

const router = express.Router();

router.get('/boq-unlock/:projectId', authenticateToken as any, getBoqUnlockStatus as any);
router.post('/boq-unlock/:projectId/order', authenticateToken as any, createBoqUnlockOrder as any);
router.post('/boq-unlock/:projectId/verify', authenticateToken as any, verifyBoqUnlockPayment as any);

export default router;
