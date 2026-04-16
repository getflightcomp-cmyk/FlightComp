/**
 * POST /api/unsubscribe
 * Body: { token }
 *
 * Sets unsubscribed_at = NOW() for the email_captures row matching the token.
 */

import { adminClient } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    const { data, error } = await adminClient
      .from('email_captures')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('unsubscribe_token', token)
      .select('email');

    if (error) throw error;
    if (!data?.length) {
      return res.status(404).json({ error: 'Token not found' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[unsubscribe]', err.message);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
}
