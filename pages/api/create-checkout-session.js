import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerEmail, successUrl, cancelUrl } = req.body;

  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing successUrl or cancelUrl' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 1900, // $19.00
            product_data: {
              name: 'EU261 Flight Claim Letter',
              description:
                'Professional AI-drafted claim letter citing the exact regulation, ' +
                'compensation amount, and 14-day legal deadline. Download as PDF.',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Allow the checkout session to show a "back" button to cancel
      payment_intent_data: {
        description: 'FlightClaim — EU261 Claim Letter',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err.message);
    return res.status(500).json({ error: 'Stripe session creation failed' });
  }
}
