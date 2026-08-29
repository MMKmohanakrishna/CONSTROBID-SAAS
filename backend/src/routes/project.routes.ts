  import { Router } from 'express';
  import { authenticateToken } from '../middlewares/auth';
  import {
    createProject,
    getProjects,
    getApprovedProjects,
    getProjectById,
    assignInspector,
    getQuotationSummary,
    scheduleInspection,
    submitInspectionReport,
    uploadDesign,
    reviewDesign,
    submitQuotation,
    verifyQuotation,
    rejectQuotation,
    requestRequote,
    deleteBoqFile,
    selectContractor,
    confirmContractor,
    acceptProject,
    declineProject,
    reopenBidding,
    visitSite,
    getProjectQuotations,
    getQuotationById,
    saveQuotationDraft,
    getQuotationDraft,
    submitDailyUpdate,
    submitSiteVisit,
    requestCompletion,
    approveCompletion,
    submitReview,
    cancelProject,
    raiseDispute,
    publishProject,
    selectProjectFiles,
    getClientRecentQuotations
  } from '../controllers/project.controller';

  const router = Router();

  // Apply auth to all project routes
  router.use(authenticateToken as any);

  router.post('/', createProject as any);
  router.get('/', getProjects as any);
  router.get('/approved', getApprovedProjects as any);
  router.get("/quotation-summary",getQuotationSummary as any);
  router.get('/:id', getProjectById as any);
  router.put('/:id/cancel', cancelProject as any);
  router.post('/:id/reviews', submitReview as any);

  // Inspection workflow
  router.put('/:id/assign', assignInspector as any);
  router.put('/:id/schedule', scheduleInspection as any);
  router.post('/:id/report', submitInspectionReport as any);
  router.post('/:id/design', uploadDesign as any);
  router.put('/:id/design-review', reviewDesign as any);
  router.put('/:id/select-files', selectProjectFiles as any);

  // Contractor bidding
  router.post('/:id/quote', submitQuotation as any);
  router.put("/:id/draft", saveQuotationDraft as any);
  router.get("/:id/draft", getQuotationDraft as any);
  router.get("/quotation-summary",getQuotationSummary as any);
  router.get(
  "/client/quotations",
  getClientRecentQuotations as any
);
  router.get("/:id/quotations", getProjectQuotations as any);
  router.get("/:projectId/quotations/:quoteId", getQuotationById as any);
  router.put('/:id/quotations/:quoteId/verify', verifyQuotation as any);
  router.put('/:id/quotations/:quoteId/reject', rejectQuotation as any);
  router.put('/:id/quotations/:quoteId/requote', requestRequote as any);
  router.delete('/:id/boq/:fileId', deleteBoqFile as any);
  router.put('/:id/quotes/:quoteId/select', selectContractor as any);
  router.put('/:id/accept-project', acceptProject as any);
  router.put('/:id/decline-project', declineProject as any);
  router.put('/:id/reopen-bidding', reopenBidding as any);
  router.put('/:id/visit-site', visitSite as any);
  router.put('/:id/confirm-contractor', confirmContractor as any);

  // Progress and monitoring
  router.post('/:id/update', submitDailyUpdate as any);
  router.post('/:id/visit', submitSiteVisit as any);
  router.post('/:id/completion-request', requestCompletion as any);
  router.put('/:id/complete-verify', approveCompletion as any);
  router.post('/:id/dispute', raiseDispute as any);

  router.put('/:id/publish', publishProject as any);

  router.put('/:id/inspection-complete', async (req, res) => {
    try {
      const { Project } = require('../models');
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      project.status = 'INSPECTION_COMPLETED';
      if (!project.inspectionCompletedAt) {
        project.inspectionCompletedAt = new Date();
      }

      console.log('Before Save:', project.inspectionCompletedAt);
      await project.save();
      console.log('After Save:', project.inspectionCompletedAt);

      return res.json({
        success: true,
        message: 'Inspection completed successfully'
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: 'Failed to complete inspection'
      });
    }
  });
  export default router;
