import { savePurchaseRecord } from '../../lib/save-purchase';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { answers, result, details, stripeSessionId } = req.body || {};
  if (!details?.email) return res.status(400).json({ error: 'Missing email' });

  try {
    const outcome = savePurchaseRecord({
      email:              details.email                || '',
      name:               details.name                || '',
      airline:            answers?.airlineName        || '',
      flightNumber:       answers?.flightNumber       || '',
      route:              `${answers?.from || ''}–${answers?.to || ''}`,
      regulation:         result?.regulation          || '',
      compensationAmount: result?.compensation?.amount || '',
      stripeSessionId:    stripeSessionId             || null,
      source:             'client',
    });

    return res.status(200).json(outcome);
  } catch (err) {
    console.error('[save-kit-purchase]', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
