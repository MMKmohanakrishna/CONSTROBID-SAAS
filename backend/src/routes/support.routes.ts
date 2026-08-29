import { Router } from 'express';
import { submitSupportMessage } from '../controllers/support.controller';

const router = Router();

// No authenticateToken here on purpose — public landing-page widget.
router.post('/', submitSupportMessage as any);

export default router;
