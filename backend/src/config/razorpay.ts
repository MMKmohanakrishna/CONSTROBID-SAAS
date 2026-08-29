import crypto from 'crypto';

/**
 * Razorpay integration without the SDK: orders are created over the REST API
 * and signatures verified with node's crypto, so there is no extra dependency
 * and no client library holding the secret.
 *
 * Required env vars:
 *   RAZORPAY_KEY_ID      - public key, also sent to the browser for checkout
 *   RAZORPAY_KEY_SECRET  - secret, must never leave the server
 */

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || '';
}

function getKeySecret() {
  return process.env.RAZORPAY_KEY_SECRET || '';
}

export function isRazorpayConfigured() {
  return !!getRazorpayKeyId() && !!getKeySecret();
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/**
 * @param amountInPaise Razorpay works in the smallest currency unit, so ₹29 is 2900.
 */
export async function createRazorpayOrder(params: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const auth = Buffer.from(`${getRazorpayKeyId()}:${getKeySecret()}`).toString('base64');

  // Node 20 ships fetch globally; the ES2022 lib does not declare it.
  const doFetch = (globalThis as any).fetch as typeof globalThis.fetch;

  const response = await doFetch(RAZORPAY_ORDERS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amountInPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  const body: any = await response.json();

  if (!response.ok) {
    throw new Error(body?.error?.description || 'Failed to create Razorpay order');
  }

  return body as RazorpayOrder;
}

/**
 * Checkout returns the signature as HMAC-SHA256("<order_id>|<payment_id>") keyed
 * with the secret. Anything that does not match is treated as unpaid.
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = getKeySecret();
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(params.signature || '');

  // Length check first: timingSafeEqual throws on a length mismatch.
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}
