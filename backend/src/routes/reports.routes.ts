import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { inspectionCsv, monitoringCsv, completionCsv } from '../controllers/reports.controller';

const router = express.Router();

router.get('/inspection/csv', authenticateToken as any, inspectionCsv as any);
router.get('/monitoring/csv', authenticateToken as any, monitoringCsv as any);
router.get('/completion/csv', authenticateToken as any, completionCsv as any);

export default router;
