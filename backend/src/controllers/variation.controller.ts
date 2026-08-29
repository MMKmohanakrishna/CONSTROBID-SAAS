import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Project } from "../models/Project";
import { VariationRequest } from "../models/VariationRequest";

export async function createVariation(
    req: AuthenticatedRequest,
    res: Response
) {
    try {

    const { id } = req.params;

    console.log("Project ID:", id);

    const contractorId = req.user?.contractorId;

if (!contractorId) {
    return res.status(403).json({
        error: "Contractor not found"
    });
}

console.log("Contractor ID:", contractorId);

const project = await Project.findById(id);

if (!project) {
    return res.status(404).json({
        error: "Project not found"
    });
}

console.log("Project Found:", project._id);

const assignedContractorId = project.selectedContractor || project.contractorId;
if (!assignedContractorId || assignedContractorId.toString() !== contractorId.toString()) {
    return res.status(403).json({
        error: "You are not the selected contractor for this project."
    });
}

console.log("Current Project Status:", project.status);

if (
    project.status !== "CONTRACTOR_CONFIRMED" &&
    project.status !== "WORK_STARTED" &&
    project.status !== "IN_PROGRESS"
) {
    return res.status(400).json({
      error: "Variation requests can only be created after the contractor is confirmed."
    });
}

const {
    title,
    reason,
    items
} = req.body;

if (!title || !reason) {
    return res.status(400).json({
        error: "Title and Reason are required."
    });
}

if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
        error: "Please add at least one item."
    });
}

const requestedAmount = items.reduce(
    (sum: number, item: any) => sum + Number(item.total || 0),
    0
);

if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return res.status(400).json({ error: "Variation amount must be greater than zero." });
}

console.log("Requested Amount:", requestedAmount);

const variation = await VariationRequest.create({
    projectId: project._id,
    contractorId,

    title,
    reason,

    items,

    requestedAmount,

    status: "PENDING_INSPECTOR",
});

return res.status(201).json({
    success: true,
    message: "Variation request created successfully.",
    variation,
});

} catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to create variation"
        });
    }
}

export async function getProjectVariations(req: AuthenticatedRequest, res: Response) {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: "Project not found" });

    console.log("=================================");
console.log("Assigned Inspector:", project.assignedInspectorId);
console.log("Logged In Inspector:", req.user?.inspectionTeamId);

const isContractor =
  String(project.selectedContractor || project.contractorId) ===
  String(req.user?.contractorId);

const isInspector = req.user?.role === "INSPECTION_TEAM";

console.log("Is Inspector:", isInspector);
console.log("=================================");
    const isClient = String(project.clientId) === String(req.user?.clientId);
    if (!isContractor && !isInspector && !isClient) {
      return res.status(403).json({ error: "You cannot view variations for this project." });
    }

    const variations = await VariationRequest.find({ projectId: project._id }).sort({ createdAt: -1 }).lean();
    return res.json({ variations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to load variations" });
  }
}

export async function getVariationById(req: Request, res: Response) {}

export async function approveVariationByInspector(req: AuthenticatedRequest, res: Response) {
  try {
    const variation = await VariationRequest.findById(req.params.id);
    if (!variation) return res.status(404).json({ error: "Variation request not found" });
    const project = await Project.findById(variation.projectId).lean();

if (!project) {
  return res.status(404).json({
    error: "Project not found."
  });
}

if (req.user?.role !== "INSPECTION_TEAM") {
  return res.status(403).json({
    error: "Only inspectors can approve this request."
  });
}
    if (variation.status !== "PENDING_INSPECTOR") {
      return res.status(400).json({ error: "This variation request has already been processed." });
    }

    variation.status = "APPROVED";
    variation.inspectorRemarks = typeof req.body?.remarks === "string" ? req.body.remarks.trim() : undefined;
    await variation.save();
    return res.json({ success: true, message: "Variation request approved.", variation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to approve variation" });
  }
}

export async function rejectVariationByInspector(req: AuthenticatedRequest, res: Response) {
  try {
    const variation = await VariationRequest.findById(req.params.id);
    if (!variation) return res.status(404).json({ error: "Variation request not found" });
    const project = await Project.findById(variation.projectId).lean();
    if (!project || String(project.assignedInspectorId) !== String(req.user?.inspectionTeamId)) {
      return res.status(403).json({ error: "Only the assigned inspector can reject this request." });
    }
    if (variation.status !== "PENDING_INSPECTOR") {
      return res.status(400).json({ error: "This variation request has already been processed." });
    }

    variation.status = "REJECTED";
    variation.inspectorRemarks = typeof req.body?.remarks === "string" ? req.body.remarks.trim() : undefined;
    await variation.save();
    return res.json({ success: true, message: "Variation request rejected.", variation });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reject variation" });
  }
}

export async function approveVariationByClient(req: Request, res: Response) {}

export async function rejectVariationByClient(req: Request, res: Response) {}

export async function updateVariation(req: Request, res: Response) {}

export async function deleteVariation(req: Request, res: Response) {}
