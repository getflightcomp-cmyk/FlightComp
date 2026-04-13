import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendEmail } from '../../lib/email';

const REQUIRED = ['fullName', 'email', 'address', 'airline', 'flightNumber', 'flightDate', 'depAirport', 'arrAirport', 'disruptionType'];

function buildConfirmationHtml(data) {
  const { fullName, email, airline, flightNumber, flightDate, depAirport, arrAirport, disruptionType, bookingRef, authId } = data;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;max-width:600px;width:100%;">

        <tr><td style="background:#0c447c;padding:24px 32px;">
          <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">FlightComp</p>
          <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Authorization Received</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hi ${fullName},</p>
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            We&apos;ve received your authorization for FlightComp to manage your compensation claim. Here&apos;s a summary:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:6px;margin:0 0 24px;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#334155;">
                <tr><td style="font-weight:600;width:40%;">Airline</td><td>${airline}</td></tr>
                <tr><td style="font-weight:600;">Flight</td><td>${flightNumber}</td></tr>
                <tr><td style="font-weight:600;">Date</td><td>${flightDate}</td></tr>
                <tr><td style="font-weight:600;">Route</td><td>${depAirport} → ${arrAirport}</td></tr>
                <tr><td style="font-weight:600;">Disruption</td><td>${disruptionType}</td></tr>
                ${bookingRef ? `<tr><td style="font-weight:600;">Booking Ref</td><td>${bookingRef}</td></tr>` : ''}
                <tr><td style="font-weight:600;">Auth ID</td><td style="font-family:monospace;font-size:12px;">${authId}</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            <strong>What happens next:</strong> Our team will review your claim and reach out within 48 hours with next steps. We&apos;ll contact the airline and relevant authorities on your behalf.
          </p>

          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">
            Our fee is <strong>25% of any compensation successfully recovered</strong>. If we don&apos;t win, you owe nothing.
          </p>
        </td></tr>

        <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
            Operated by Noontide Ventures LLC · Georgia, USA ·
            <a href="https://getflightcomp.com" style="color:#94a3b8;">getflightcomp.com</a> ·
            Questions? <a href="mailto:support@getflightcomp.com" style="color:#94a3b8;">support@getflightcomp.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationText(data) {
  const { fullName, airline, flightNumber, flightDate, depAirport, arrAirport, disruptionType, authId } = data;
  return [
    `Hi ${fullName},`,
    '',
    'We\'ve received your authorization for FlightComp to manage your compensation claim.',
    '',
    `Airline: ${airline}`,
    `Flight: ${flightNumber}`,
    `Date: ${flightDate}`,
    `Route: ${depAirport} to ${arrAirport}`,
    `Disruption: ${disruptionType}`,
    `Authorization ID: ${authId}`,
    '',
    'Our team will review your claim and reach out within 48 hours with next steps.',
    '',
    'Our fee is 25% of any compensation successfully recovered. No win, no fee.',
    '',
    '---',
    'Operated by Noontide Ventures LLC · getflightcomp.com',
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};

  // Validate required fields
  const missing = REQUIRED.filter((k) => !String(body[k] || '').trim());
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const { email } = body;
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const authId = crypto.randomUUID();
  const entry = {
    authId,
    ...body,
    submittedAt: new Date().toISOString(),
  };

  // Persist to data/authorizations.json
  const dataDir  = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'authorizations.json');
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    let existing = [];
    if (fs.existsSync(filePath)) {
      try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { /* start fresh */ }
    }
    existing.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error('[authorize] Failed to save:', err);
    return res.status(500).json({ error: 'Failed to save authorization' });
  }

  // Send confirmation email
  try {
    await sendEmail({
      to: email,
      subject: 'FlightComp — Authorization Received',
      html: buildConfirmationHtml(entry),
      text: buildConfirmationText(entry),
    });
  } catch (err) {
    // Email failure is non-fatal — the record is already saved
    console.error('[authorize] Email failed:', err);
  }

  return res.status(200).json({ ok: true, authId });
}
