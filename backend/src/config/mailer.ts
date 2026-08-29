import nodemailer from 'nodemailer';
import { EmailTemplate } from '../models';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

export const APP_URL = process.env.APP_URL || 'https://constrobid.com';

interface EmailOptions {
  to: string;
  templateType: string;
  context: Record<string, string>;
}

/**
 * Templates are authored as small HTML fragments. This wraps one in the
 * ConstroBID shell so every notification looks the same in the inbox.
 */
function renderLayout(bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#f4f5f7;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(16,24,40,.08);">
      <tr>
        <td style="background:#70153a;padding:24px 28px;">
          <div style="font-size:20px;font-weight:700;letter-spacing:.5px;color:#ffffff;">ConstroBID</div>
          <div style="font-size:10px;letter-spacing:2px;color:#efc975;text-transform:uppercase;margin-top:2px;">Inspection Managed Construction</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;color:#1f2937;font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;background:#faf7f8;border-top:1px solid #f0e6ea;color:#6b7280;font-size:12px;line-height:1.6;">
          You are receiving this because you have a ConstroBID account.<br />
          <a href="${APP_URL}" style="color:#70153a;text-decoration:none;font-weight:600;">${APP_URL.replace(/^https?:\/\//, '')}</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Plain-text alternative for clients that will not render HTML. */
function toPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function interpolate(input: string, context: Record<string, string>) {
  let output = input;
  for (const [key, value] of Object.entries(context)) {
    output = output.replace(new RegExp(`{{\s*${key}\s*}}`, 'g'), String(value ?? ''));
  }
  // Any placeholder the caller did not supply would otherwise reach the inbox.
  return output.replace(/{{\s*[\w.]+\s*}}/g, '');
}

export async function sendEmail({ to, templateType, context }: EmailOptions) {
  if (!to) {
    logger.warn('sendEmail skipped: no recipient', { templateType });
    return null;
  }

  try {
    const dbTemplate = (await EmailTemplate.findOne({ type: templateType }).lean().exec()) as any;

    if (!dbTemplate) {
      // Without a template the recipient would get a raw context dump, which is
      // worse than sending nothing at all.
      logger.error('sendEmail skipped: template missing', { templateType, to });
      return null;
    }

    const subject = interpolate(dbTemplate.subject, context);
    const bodyHtml = interpolate(dbTemplate.body, context);
    const html = renderLayout(bodyHtml);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ConstroBID" <no-reply@constrobid.com>',
      to,
      subject,
      text: toPlainText(bodyHtml),
      html,
    });

    logger.info('Email sent', { templateType, to, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Error sending email', { templateType, to, error });
    // Do not throw: a failed notification must not fail the API request.
    return null;
  }
}

/** Verifies the SMTP credentials without sending anything. */
export async function verifyMailer() {
  try {
    await transporter.verify();
    logger.info('SMTP connection verified', { host: process.env.EMAIL_HOST });
    return true;
  } catch (error) {
    logger.error('SMTP verification failed', { error: (error as any)?.message });
    return false;
  }
}
