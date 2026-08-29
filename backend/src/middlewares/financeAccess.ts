import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from './auth';
import {
  FinanceSubscription,
  FINANCE_TRIAL_DAYS,
  resolveSubscriptionStatus,
} from '../models/FinanceSubscription';

/**
 * Every finance route belongs to exactly one contractor. Anything that cannot
 * resolve a contractor profile has no business in this module.
 */
export function requireContractor(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== Role.CONTRACTOR) {
    return res.status(403).json({ error: 'Only contractors can use Project Finance' });
  }

  if (!req.user?.contractorId) {
    return res.status(403).json({ error: 'Contractor profile not found' });
  }

  return next();
}

/**
 * Returns the contractor's subscription, creating it on first contact so the
 * 14-day trial starts when they actually open the module.
 */
export async function getOrStartSubscription(contractorId: string, userId?: string) {
  const existing = await FinanceSubscription.findOne({ contractorId }).exec();
  if (existing) return existing;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + FINANCE_TRIAL_DAYS);

  return FinanceSubscription.create({ contractorId, userId, trialEndsAt });
}

/**
 * Write gate. Reads stay open in every state — an expired contractor keeps
 * full sight of their own data, they simply cannot change it.
 */
export async function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const subscription = await getOrStartSubscription(
      String(req.user?.contractorId),
      req.user?.id
    );

    const status = resolveSubscriptionStatus(subscription);

    if (status === 'expired') {
      return res.status(402).json({
        error: 'Your Project Finance subscription has ended. Pay ₹149 to unlock adding and editing.',
        code: 'FINANCE_SUBSCRIPTION_REQUIRED',
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
