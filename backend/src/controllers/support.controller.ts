import { Request, Response } from 'express';
import { SupportMessage } from '../models/SupportMessage';
import { sendEmail } from '../config/mailer';
import logger from '../utils/logger';

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER_DISPLAY || 'anirban@constrobid.com';

// Public endpoint — used by both the landing-page chat widget (email +
// message only) and the Contact Us form (adds name + phone). Visitors on
// either aren't logged in, so this deliberately doesn't require auth.
export async function submitSupportMessage(req: Request, res: Response) {
  const { name, phone, email, message } = req.body;

  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'Email is required so we can reply.' });
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const record = await SupportMessage.create({
      name: name ? String(name).trim() : '',
      phone: phone ? String(phone).trim() : '',
      email: String(email).trim(),
      message: String(message).trim(),
      source: name || phone ? 'CONTACT_FORM' : 'CHAT_WIDGET',
    });

    // Notify the team, and confirm receipt to the visitor. Neither failing
    // should fail the request — the message is already saved.
    try {
      await sendEmail({
        to: SUPPORT_INBOX,
        templateType: 'SUPPORT_MESSAGE_RECEIVED',
        context: {
          fromName: record.name || 'Not provided',
          fromPhone: record.phone || 'Not provided',
          fromEmail: record.email,
          message: record.message,
        },
      });
    } catch (err) {
      logger.error('submitSupportMessage: team notify failed', err);
    }

    try {
      await sendEmail({
        to: record.email,
        templateType: 'SUPPORT_MESSAGE_CONFIRMATION',
        context: { message: record.message },
      });
    } catch (err) {
      logger.error('submitSupportMessage: visitor confirmation failed', err);
    }

    return res.status(201).json({ success: true, id: record._id });
  } catch (error) {
    logger.error('submitSupportMessage', error);
    return res.status(500).json({ error: 'Could not send your message. Please try again.' });
  }
}
