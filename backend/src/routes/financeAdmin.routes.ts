import express from 'express';
import { authenticateToken, authorizeRoles, Role } from '../middlewares/auth';
import {
  listFinanceContractors,
  getFinanceContractor,
  getFinanceProjectForInspector,
} from '../controllers/financeAdmin.controller';

const router = express.Router();

/**
 * The inspection team's oversight view. Mounted ahead of the contractor router
 * so it is not caught by that router's requireContractor guard.
 *
 * Read-only by construction: there are no write routes here at all.
 */
router.use(authenticateToken as any);
router.use(authorizeRoles(Role.INSPECTION_TEAM, Role.INSPECTOR, Role.ADMIN) as any);

router.get('/contractors', listFinanceContractors as any);
router.get('/contractors/:contractorId', getFinanceContractor as any);
router.get('/projects/:projectId', getFinanceProjectForInspector as any);

export default router;
