/**
 * Stripe webhook handler — server-side payment verification.
 *
 * Endpoint: POST /api/stripe/webhook
 * Event:    checkout.session.completed
 *
 * Register this URL in the Stripe Dashboard → Developers → Webhooks:
 *   https://getflightcomp.com/api/stripe/webhook
 *
 * Required env var: STRIPE_WEBHOOK_SECRET  (whsec_… from the Stripe webhook dashboard)
 */

import Stripe           from 'stripe';
import { savePurchaseRecord } from '../../../lib/save-purchase';

// ── Disable Next.js body parsing — Stripe requires the raw bytes for HMAC ──
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

/** Collect the raw request body as a Buffer. */
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end',  ()    => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── 1. Read raw body ──
  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[webhook] Failed to read body:', err.message);
    return res.status(400).json({ error: 'Could not read request body' });
  }

  // ── 2. Verify Stripe signature ──
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  // ── 3. Dispatch event ──
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    console.log('[webhook] checkout.session.completed', {
      sessionId:     session.id,
      paymentStatus: session.payment_status,
      email:         session.customer_details?.email || session.customer_email,
      metadata:      session.metadata,
    });

    // Only fulfil confirmed payments (not e.g. "unpaid" buy-now-pay-later)
    if (session.payment_status === 'paid') {
      const meta = session.metadata || {};
      const email = meta.email
        || session.customer_details?.email
        || session.customer_email
        || '';

      try {
        const outcome = savePurchaseRecord({
          email,
          name:               meta.name               || '',
          airline:            meta.airline             || '',
          flightNumber:       meta.flightNumber        || '',
          route:              meta.route               || '',
          regulation:         meta.regulation          || '',
          compensationAmount: meta.compensation        || '',
          stripeSessionId:    session.id,
          source:             'webhook',
        });

        if (outcome.skipped) {
          console.log('[webhook] purchase already recorded — skipping duplicate', session.id);
        } else {
          console.log('[webhook] purchase record saved for session', session.id);
        }
      } catch (err) {
        // Log but still return 200 so Stripe doesn't retry indefinitely
        console.error('[webhook] Failed to save purchase record:', err.message);
      }
    }
  }

  // Acknowledge receipt for all event types (including unhandled ones)
  return res.status(200).json({ received: true });
}
