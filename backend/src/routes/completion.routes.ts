import express from 'express';
import * as completionCtrl from '../controllers/completion.controller';
import { authenticateToken, authorizeRoles, Role } from '../middlewares/auth';

const router = express.Router();

// Completion requests (contractor)
router.post('/requests', authenticateToken, authorizeRoles(Role.CONTRACTOR), completionCtrl.createCompletionRequest);
router.get('/requests', authenticateToken, authorizeRoles(Role.ADMIN, Role.INSPECTION_TEAM, Role.CONTRACTOR, Role.CLIENT), completionCtrl.listCompletionRequests);
router.get('/requests/:id', authenticateToken, completionCtrl.getCompletionRequest);
router.patch('/requests/:id', authenticateToken, authorizeRoles(Role.ADMIN, Role.INSPECTION_TEAM), completionCtrl.updateCompletionRequest);

// Punchlists
router.post('/punchlists', authenticateToken, authorizeRoles(Role.INSPECTION_TEAM), completionCtrl.createPunchList);
router.get('/punchlists', authenticateToken, authorizeRoles(Role.ADMIN, Role.INSPECTION_TEAM, Role.CONTRACTOR), completionCtrl.getPunchList);
router.patch('/punchlists/:id/items/:itemId', authenticateToken, authorizeRoles(Role.INSPECTION_TEAM, Role.CONTRACTOR), completionCtrl.updatePunchItem);

// Verifications
router.post('/verifications', authenticateToken, authorizeRoles(Role.INSPECTION_TEAM), completionCtrl.createVerification);
router.get('/verifications', authenticateToken, authorizeRoles(Role.ADMIN, Role.INSPECTION_TEAM, Role.CONTRACTOR, Role.CLIENT), completionCtrl.listVerifications);

// Handover
router.post('/handovers', authenticateToken, authorizeRoles(Role.INSPECTION_TEAM, Role.ADMIN), completionCtrl.createHandover);
router.post('/handovers/:id/sign', authenticateToken, completionCtrl.signHandover);
router.get('/handovers/:id', authenticateToken, completionCtrl.getHandover);

export default router;
