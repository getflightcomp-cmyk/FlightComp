import fs   from 'fs';
import path from 'path';
import { adminClient } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    email,
    airline,
    route,
    compensationAmount,
    verdict,
    regulation,
    flightNumber,
    timestamp,
  } = req.body || {};

  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Parse route "DUB–STN" into origin / destination
  const routeParts = route ? route.split(/[–\-→]/) : [];
  const origin      = routeParts[0]?.trim() || '';
  const destination = routeParts[1]?.trim() || '';

  const capturedAt = timestamp || new Date().toISOString();

  // ── 1. Write to Supabase (upsert by email — one row per address) ──
  try {
    const { error } = await adminClient
      .from('email_captures')
      .upsert(
        {
          email,
          airline:              airline            || null,
          flight_number:        flightNumber       || null,
          origin:               origin             || null,
          destination:          destination        || null,
          compensation_amount:  compensationAmount || null,
          eligibility_verdict:  verdict            || null,
          regulation:           regulation         || null,
          captured_at:          capturedAt,
          // Do not overwrite converted_at / unsubscribed_at / reminder_*_sent_at
          // if the record already exists with those fields set — use ignoreDuplicates: false
          // but only update the claim-data columns.
        },
        {
          onConflict:       'email',
          ignoreDuplicates: false,
        },
      );

    if (error) throw error;
  } catch (err) {
    console.error('[email-capture] Supabase write failed — falling back to JSON:', err.message);

    // ── 2. JSON fallback ──
    const dataDir  = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'email-captures.json');

    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      let existing = [];
      if (fs.existsSync(filePath)) {
        try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { /* start fresh */ }
      }

      existing.push({ email, airline, route, compensationAmount, verdict, regulation, timestamp: capturedAt });
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    } catch (fsErr) {
      console.error('[email-capture] JSON fallback also failed:', fsErr.message);
      return res.status(500).json({ error: 'Failed to save email capture' });
    }
  }

  return res.status(200).json({ ok: true });
}
