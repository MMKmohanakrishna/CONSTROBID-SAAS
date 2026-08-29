"use client";

import { apiRequest } from "@/lib/api";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<boolean> | null = null;

/** Loads Razorpay's checkout script once and reuses it afterwards. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export const boqUnlockApi = {
  status: (projectId: string) => apiRequest(`/payments/boq-unlock/${projectId}`),

  createOrder: (projectId: string) =>
    apiRequest(`/payments/boq-unlock/${projectId}/order`, { method: "POST" }),

  verify: (projectId: string, payload: any) =>
    apiRequest(`/payments/boq-unlock/${projectId}/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/**
 * Runs the whole unlock flow: create an order, open checkout, then verify the
 * signature on the server. Resolves true only once the server confirms.
 *
 * Verification is deliberately server-side — the checkout callback alone proves
 * nothing, since anything the browser reports can be forged.
 */
export async function payToUnlockBoq(projectId: string): Promise<boolean> {
  const order: any = await boqUnlockApi.createOrder(projectId);

  if (order?.alreadyUnlocked) return true;

  const ready = await loadRazorpayScript();
  if (!ready) throw new Error("Could not load the payment window. Check your connection.");

  return new Promise<boolean>((resolve, reject) => {
    const checkout = new (window as any).Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "ConstroBID",
      description: `BOQ access — ${order.projectTitle || "your project"}`,
      prefill: order.prefill,
      theme: { color: "#70153A" },
      handler: async (response: any) => {
        try {
          const result: any = await boqUnlockApi.verify(projectId, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(!!result?.unlocked);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        // Closing the window is a cancel, not a failure.
        ondismiss: () => resolve(false),
      },
    });

    checkout.on("payment.failed", (event: any) => {
      reject(new Error(event?.error?.description || "Payment failed"));
    });

    checkout.open();
  });
}

/**
 * Same flow as the BOQ unlock, for the ₹149 Project Finance subscription:
 * create an order, open checkout, verify the signature server-side.
 *
 * Resolves true only once the server confirms; false means the contractor
 * closed the payment window, which is a cancel rather than a failure.
 */
export async function payForFinanceSubscription(): Promise<boolean> {
  const { financeApi } = await import("@/lib/api");

  const order: any = await financeApi.createSubscriptionOrder();

  const ready = await loadRazorpayScript();
  if (!ready) throw new Error("Could not load the payment window. Check your connection.");

  return new Promise<boolean>((resolve, reject) => {
    const checkout = new (window as any).Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "ConstroBID",
      description: "Project Finance — 1 month",
      prefill: order.prefill,
      theme: { color: "#70153A" },
      handler: async (response: any) => {
        try {
          const result: any = await financeApi.verifySubscription({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(!!result?.unlocked);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => resolve(false),
      },
    });

    checkout.on("payment.failed", (event: any) => {
      reject(new Error(event?.error?.description || "Payment failed"));
    });

    checkout.open();
  });
}
