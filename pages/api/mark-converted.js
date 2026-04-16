/**
 * POST /api/mark-converted
 * Body: { email }
 *
 * Sets converted_at = NOW() on the matching email_captures row.
 * Called client-side after a kit purchase (success.jsx) or managed-service
 * authorisation (authorize.jsx). Fire-and-forget — non-fatal if it fails.
 */

import { adminClient } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const { error } = await adminClient
      .from('email_captures')
      .update({ converted_at: new Date().toISOString() })
      .eq('email', email)
      .is('converted_at', null); // Only set once

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[mark-converted]', err.message);
    return res.status(500).json({ error: 'Failed to mark converted' });
  }
}
