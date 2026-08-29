import express from 'express';
import { authenticateToken, authorizeRoles, Role } from '../middlewares/auth';
import {
  getMonitoringSummary,
  listProjectUpdates,
  createProjectUpdate,
  createSiteVisit,
  listSiteVisits,
  flagDelay,
  recordQualityCheck,
} from '../controllers/monitoring.controller';

const router = express.Router();

// Summary endpoint (inspection team and admins)
router.get('/summary', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.ADMIN) as any, getMonitoringSummary as any);

// Project updates
router.get('/updates', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.CLIENT, Role.CONTRACTOR, Role.ADMIN) as any, listProjectUpdates as any);
router.post('/updates', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.CLIENT, Role.CONTRACTOR, Role.ADMIN) as any, createProjectUpdate as any);

// Site visits
router.post('/visits', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, createSiteVisit as any);
router.get('/visits', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.ADMIN) as any, listSiteVisits as any);

// Delay tracking
router.post('/projects/:id/delay', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.ADMIN) as any, flagDelay as any);

// Quality checks
router.post('/projects/:id/quality', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM, Role.ADMIN) as any, recordQualityCheck as any);

export default router;
