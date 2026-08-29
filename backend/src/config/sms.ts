import logger from '../utils/logger';

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

interface SendSmsOptions {
  to: string; // E.164 or bare Indian 10-digit number
  content: string;
}

function normalizeIndianNumber(raw: string) {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

/**
 * Sends an SMS through Brevo's Transactional SMS API. Distinct credential
 * from the SMTP email login — BREVO_API_KEY is the account's API key, and
 * BREVO_SMS_SENDER must be a sender name/number approved in Brevo (and, for
 * India, backed by a DLT-registered template on your Brevo account).
 */
export async function sendSms({ to, content }: SendSmsOptions) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SMS_SENDER;

  if (!apiKey || !sender) {
    logger.error('sendSms skipped: BREVO_API_KEY or BREVO_SMS_SENDER not configured', { to });
    return null;
  }
  if (!to) {
    logger.warn('sendSms skipped: no recipient');
    return null;
  }

  try {
    const response = await fetch(BREVO_SMS_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        recipient: normalizeIndianNumber(to),
        content,
        type: 'transactional',
      }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      logger.error('sendSms failed', { to, status: response.status, body });
      return null;
    }

    logger.info('SMS sent', { to, messageId: (body as any)?.reference });
    return body;
  } catch (error) {
    logger.error('sendSms error', { to, error: (error as any)?.message });
    // Do not throw: a failed SMS must not fail the API request.
    return null;
  }
}
