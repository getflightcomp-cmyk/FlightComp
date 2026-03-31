import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, airline, route, compensationAmount, verdict, timestamp } = req.body || {};

  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const entry = {
    email,
    airline:           airline           || '',
    route:             route             || '',
    compensationAmount: compensationAmount || '',
    verdict:           verdict           || '',
    timestamp:         timestamp         || new Date().toISOString(),
  };

  const dataDir  = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'email-captures.json');

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    let existing = [];
    if (fs.existsSync(filePath)) {
      try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { /* start fresh */ }
    }

    existing.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[email-capture]', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
