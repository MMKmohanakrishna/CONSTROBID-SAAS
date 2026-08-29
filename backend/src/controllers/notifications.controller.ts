import { Request, Response } from 'express';
import logger from '../utils/logger';
import { Notification } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

export async function listNotifications(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    console.log("REQ USER:", req.user);

    const userId = new ObjectId(req.user?.id);

    console.log("USER ID:", userId);

    const list = await Notification.find({
      recipient: userId
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log("NOTIFICATIONS:", list);

    return res.json(list);
  } catch (error) {
    logger.error("listNotifications", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const n = await Notification.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean().exec();
    return res.json(n);
  } catch (error) {
    logger.error('markNotificationRead', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = new ObjectId(req.user?.id);
    await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } }).exec();
    return res.json({ ok: true });
  } catch (error) {
    logger.error('markAllRead', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
