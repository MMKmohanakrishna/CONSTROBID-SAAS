import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";

import {
    createVariation,
    getProjectVariations,
    getVariationById,
    approveVariationByInspector,
    rejectVariationByInspector,
    approveVariationByClient,
    rejectVariationByClient,
    updateVariation,
    deleteVariation,
} from "../controllers/variation.controller";

const router = Router();

router.use(authenticateToken as any);

// Contractor
router.post("/projects/:id/variations", createVariation as any);
router.get("/projects/:id/variations", getProjectVariations as any);
router.put("/variations/:id", updateVariation as any);
router.delete("/variations/:id", deleteVariation as any);

// Inspector
router.put(
    "/variations/:id/inspector-approve",
    approveVariationByInspector as any
);

router.put(
    "/variations/:id/inspector-reject",
    rejectVariationByInspector as any
);

// Client
router.put(
    "/variations/:id/client-approve",
    approveVariationByClient as any
);

router.put(
    "/variations/:id/client-reject",
    rejectVariationByClient as any
);

// Common
router.get("/variations/:id", getVariationById as any);

export default router;