import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { answers, result, details } = req.body || {};
  if (!details?.email) return res.status(400).json({ error: 'Missing email' });

  const entry = {
    email:               details.email                    || '',
    name:                details.name                     || '',
    airline:             answers?.airlineName             || '',
    flightNumber:        answers?.flightNumber            || '',
    route:               `${answers?.from || ''}–${answers?.to || ''}`,
    regulation:          result?.regulation               || '',
    compensationAmount:  result?.compensation?.amount     || '',
    purchaseDate:        new Date().toISOString(),
    managedServiceSignup: false,
  };

  const dataDir  = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'kit-purchases.json');

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
    console.error('[save-kit-purchase]', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
