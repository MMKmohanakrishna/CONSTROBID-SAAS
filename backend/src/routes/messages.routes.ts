import express from 'express';
import { authenticateToken } from '../middlewares/auth';
import { sendMessage, listConversations, conversationDetail, markRead, uploadFiles, requestChanges, approveProject } from '../controllers/messages.controller';
import uploader from '../middleware/upload';

const router = express.Router();

router.post('/send', authenticateToken as any, sendMessage as any);
router.get('/conversations', authenticateToken as any, listConversations as any);
router.get('/conversations/:id', authenticateToken as any, conversationDetail as any);
router.post('/conversations/mark-read', authenticateToken as any, markRead as any);
// inspector uploads design files
router.post('/upload', authenticateToken as any, uploader.array('images', 10), uploadFiles as any);
router.post('/request-changes', authenticateToken as any, requestChanges as any);
router.post('/approve', authenticateToken as any, approveProject as any);

export default router;
