import { Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import { Project, Client, User, Payment } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from '../config/razorpay';

const { ObjectId } = mongoose.Types;

/** ₹29, in paise. Razorpay works in the smallest currency unit. */
export const BOQ_UNLOCK_AMOUNT_PAISE = 2900;

/**
 * The unlock is stored on the project, not on a single BOQ file, so a client
 * who has paid keeps access to every later revision the inspector uploads after
 * a change request.
 */
export async function isBoqUnlocked(projectId: any) {
  if (!projectId) return false;

  const project = await Project.findById(projectId).select('boqUnlocked').lean().exec();
  return !!(project as any)?.boqUnlocked;
}

type ClientGuard =
  | { ok: false; error: string; status: number }
  | { ok: true; project: any };

/** Confirms the caller is the client who owns this project. */
async function assertProjectClient(
  req: AuthenticatedRequest,
  projectId: string
): Promise<ClientGuard> {
  const project = await Project.findById(projectId).exec();
  if (!project) return { ok: false, error: 'Project not found', status: 404 };

  const client = await Client.findById(project.clientId).lean().exec();
  const clientUserId = (client as any)?.userId;

  if (!clientUserId || String(clientUserId) !== String(req.user?.id)) {
    return { ok: false, error: 'Not authorised for this project', status: 403 };
  }

  return { ok: true, project };
}

export async function getBoqUnlockStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.params;

    const result = await assertProjectClient(req, projectId);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    return res.json({
      unlocked: !!result.project.boqUnlocked,
      amount: BOQ_UNLOCK_AMOUNT_PAISE,
      currency: 'INR',
      configured: isRazorpayConfigured(),
    });
  } catch (error) {
    logger.error('getBoqUnlockStatus', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createBoqUnlockOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.params;

    const result = await assertProjectClient(req, projectId);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    const { project } = result;

    // Already paid: never charge twice for the same project.
    if (project.boqUnlocked) {
      return res.json({ alreadyUnlocked: true });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: 'Online payment is not configured. Please contact ConstroBID support.',
      });
    }

    const order = await createRazorpayOrder({
      amountInPaise: BOQ_UNLOCK_AMOUNT_PAISE,
      receipt: `boq_${projectId}`.slice(0, 40),
      notes: { projectId: String(projectId), purpose: 'BOQ_UNLOCK' },
    });

    await Payment.create({
      projectId: new ObjectId(projectId),
      userId: new ObjectId(String(req.user?.id)),
      purpose: 'BOQ_UNLOCK',
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: 'CREATED',
    });

    // Checkout prefills these so the client does not retype them.
    const client = await Client.findById(project.clientId).lean().exec();
    const user = await User.findById(req.user?.id).lean().exec();

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      projectTitle: project.title,
      prefill: {
        name: (client as any)?.name || '',
        email: (user as any)?.email || '',
        contact: (client as any)?.phone || '',
      },
    });
  } catch (error) {
    logger.error('createBoqUnlockOrder', error);
    return res.status(500).json({ error: 'Unable to start the payment. Please try again.' });
  }
}

export async function verifyBoqUnlockPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { projectId } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as any;

    const result = await assertProjectClient(req, projectId);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Incomplete payment details' });
    }

    // The order must be one we created, for this project and this user.
    const payment = await Payment.findOne({
      razorpayOrderId,
      projectId: new ObjectId(projectId),
      userId: new ObjectId(String(req.user?.id)),
      purpose: 'BOQ_UNLOCK',
    }).exec();

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const valid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'PAID';
    await payment.save();

    await Project.findByIdAndUpdate(projectId, {
      boqUnlocked: true,
      boqUnlockedAt: new Date(),
    }).exec();

    return res.json({ unlocked: true });
  } catch (error) {
    logger.error('verifyBoqUnlockPayment', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
