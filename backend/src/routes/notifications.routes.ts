import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { listNotifications, markNotificationRead, markAllRead } from '../controllers/notifications.controller';

const router = express.Router();

router.get('/', authenticateToken as any, listNotifications as any);
router.post('/:id/read', authenticateToken as any, markNotificationRead as any);
router.post('/mark-all-read', authenticateToken as any, markAllRead as any);

export default router;
