import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import {
  getUsers,
  updateUser,
  deleteUser,
  getRevenueDetails,
  updateCommissionConfig,
  getAuditLogs,
  getEmailTemplates,
  updateEmailTemplate,
  resolveDispute
} from '../controllers/admin.controller';
import { Role } from '../middlewares/auth';

const router = Router();

// Only ADMIN role has access to these endpoints
router.use(authenticateToken as any);
router.use(authorizeRoles(Role.ADMIN) as any);

router.get('/users', getUsers as any);
router.put('/users/:id', updateUser as any);
router.delete('/users/:userId', deleteUser as any);

router.get('/revenue', getRevenueDetails as any);
router.put('/commission', updateCommissionConfig as any);
router.get('/logs', getAuditLogs as any);

router.get('/templates', getEmailTemplates as any);
router.put('/templates/:id', updateEmailTemplate as any);

router.put('/disputes/:disputeId', resolveDispute as any);

export default router;
