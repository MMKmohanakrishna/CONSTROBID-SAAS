import express from 'express';
import { loginInspection } from '../controllers/auth.controller';
import { authenticateToken, authorizeRoles, Role } from '../middlewares/auth';
import { Project, Contractor, InspectionReport, Dispute } from '../models';
import { getContractors, getContractorById, approveContractor, rejectContractor, requestDocuments, blockContractor  } from '../controllers/inspection.controller';
import logger from '../utils/logger';

const router = express.Router();

// Public inspection login endpoint (separate from general auth)
router.post('/login', loginInspection as any);

// Protected inspection dashboard summary
router.get('/dashboard', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM,Role.INSPECTOR) as any, async (req, res) => {
  try {
    const todaysInspections = await InspectionReport.countDocuments({ scheduledDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } }).exec();
    const pendingInspections = await InspectionReport.countDocuments({ status: 'PENDING' as any }).exec();
    const activeProjects = await Project.countDocuments({ status: { $in: ['IN_PROGRESS','WORK_STARTED'] } as any }).exec();
    const projectsUnderMonitoring = await Project.countDocuments({ status: 'IN_PROGRESS' as any }).exec();
    const pendingContractorVerifications = await Contractor.countDocuments({ status: 'PENDING_VERIFICATION' }).exec();
    const completionRequests = await Project.countDocuments({ status: 'COMPLETION_VERIFICATION' as any }).exec();
    const openDisputesCount = await Dispute.countDocuments({
    status: 'OPEN'
}).exec();
    return res.json({
    todaysInspections,
    pendingInspections,
    activeProjects,
    projectsUnderMonitoring,
    pendingContractorVerifications,
    completionRequests,
    openDisputesCount
});
  } catch (error) {
    logger.error('Inspection dashboard error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Expose profile for inspection team (frontend expects /api/inspection/profile)
import { profile as authProfile } from '../controllers/auth.controller';
router.get('/profile', authenticateToken as any, authorizeRoles(
    Role.INSPECTION_TEAM,
    Role.INSPECTOR) as any, (req, res) => authProfile(req as any, res as any));

// Contractor verification endpoints
router.get('/contractors', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getContractors as any);
router.get('/contractors/pending', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, async (req, res) => {
  // alias to /contractors?status=PENDING_VERIFICATION
  req.query.status = 'PENDING_VERIFICATION';
  return getContractors(req as any, res as any);
});
router.get('/contractors/:id', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getContractorById as any);
router.post('/contractors/:id/approve', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, approveContractor as any);
router.post('/contractors/:id/reject', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, rejectContractor as any);
router.post(
  '/contractors/:id/block',
  authenticateToken as any,
  authorizeRoles(Role.INSPECTION_TEAM) as any,
  blockContractor as any
);
router.post('/contractors/:id/request-documents', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, requestDocuments as any);

// Site inspection endpoints
import {
  getSiteInspections,
  getSiteInspectionById,
  createSiteInspection,
  updateSiteInspection,
  startSiteInspection,
  completeSiteInspection,
  submitInspectionReport,
  uploadInspectionPhotos,
  uploadInspectionVideos,
  uploadInspectionDocuments,
  getInspectionTimeline,
} from '../controllers/inspectionSite.controller';

router.get('/site-inspections', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getSiteInspections as any);
router.post('/site-inspections', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, createSiteInspection as any);
router.get('/site-inspections/:id', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getSiteInspectionById as any);
router.put('/site-inspections/:id', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, updateSiteInspection as any);
router.post('/site-inspections/:id/start', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, startSiteInspection as any);
router.post('/site-inspections/:id/complete', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, completeSiteInspection as any);
router.post('/site-inspections/:id/report', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, submitInspectionReport as any);
router.post('/site-inspections/:id/photos', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, uploadInspectionPhotos as any);
router.post('/site-inspections/:id/videos', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, uploadInspectionVideos as any);
router.post('/site-inspections/:id/documents', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, uploadInspectionDocuments as any);
router.get('/site-inspections/:id/timeline', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getInspectionTimeline as any);
// Design packages
import {
  getDesignPackages,
  getDesignDashboard,
  getDesignPackageById,
  createDesignPackage,
  updateDesignPackage,
  approveDesignPackage,
  rejectDesignPackage,
  uploadDesignFiles,
} from '../controllers/design.controller';

router.get(
  '/design/dashboard',
  authenticateToken as any,
  authorizeRoles(Role.INSPECTION_TEAM) as any,
  getDesignDashboard as any
);
router.get('/design', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getDesignPackages as any);
router.post('/design', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, createDesignPackage as any);
router.get('/design/:id', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, getDesignPackageById as any);
router.put('/design/:id', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, updateDesignPackage as any);
router.post('/design/:id/approve', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, approveDesignPackage as any);
router.post('/design/:id/reject', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, rejectDesignPackage as any);
router.post('/design/:id/files', authenticateToken as any, authorizeRoles(Role.INSPECTION_TEAM) as any, uploadDesignFiles as any);
export default router;
