import fs from 'fs';
import path from 'path';
import { sendEmail } from '../../../lib/email';

// Escalation authority per regulation
function getAuthority(regulation) {
  switch (regulation) {
    case 'UK261': return 'the UK Civil Aviation Authority (CAA)';
    case 'APPR':  return 'the Canadian Transportation Agency (CTA)';
    case 'SHY':   return 'the Directorate General of Civil Aviation (DGCA/SHGM)';
    default:      return 'your national enforcement body (NEB)';
  }
}

function buildEmailHtml({ name, airline, flightNumber, regulation, compensationAmount }) {
  const authority = getAuthority(regulation);
  const firstName = name ? name.split(' ')[0] : 'there';
  const compLine  = compensationAmount
    ? `You may be entitled to <strong>${compensationAmount}</strong> in compensation.`
    : 'You may be entitled to statutory compensation.';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0c447c;padding:24px 32px;">
          <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">FlightComp</p>
          <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Flight Compensation Specialists</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hi ${firstName},</p>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            30 days ago, you submitted a compensation claim to <strong>${airline || 'your airline'}</strong>
            ${flightNumber ? `for flight <strong>${flightNumber}</strong>` : ''}.
            If you haven't heard back — or if they rejected your claim — we can take it from here.
          </p>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            ${compLine}
          </p>

          <!-- Value prop box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#e6f1fb;border-radius:6px;margin:24px 0;">
            <tr><td style="padding:20px 24px;">
              <p style="font-size:14px;font-weight:bold;color:#0c447c;margin:0 0 10px;">Our managed service handles everything:</p>
              <ul style="font-size:14px;color:#334155;margin:0;padding-left:20px;line-height:1.8;">
                <li>Follow-up letters and escalation to the airline</li>
                <li>Formal complaint with ${authority}</li>
                <li>Legal action if needed — all at no upfront cost</li>
              </ul>
            </td></tr>
          </table>

          <!-- Pricing highlight -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c447c;border-radius:6px;margin:0 0 24px;">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="color:#c3daf8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Our fee</p>
              <p style="color:#fff;font-size:22px;font-weight:bold;margin:0;">25% of your compensation</p>
              <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Only if we win &mdash; no upfront cost, no hidden fees, ever.</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="https://getflightcomp.com" style="display:inline-block;background:#3b82f6;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:6px;">
                Let Us Handle It
              </a>
            </td></tr>
          </table>

          <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
            If you've already been paid or resolved your claim, no action needed — congrats!
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;line-height:1.6;">
            You received this because you purchased a Flight Compensation Kit from FlightComp.
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            <a href="https://getflightcomp.com" style="color:#94a3b8;">getflightcomp.com</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:support@getflightcomp.com?subject=Unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText({ name, airline, flightNumber, regulation, compensationAmount }) {
  const authority = getAuthority(regulation);
  const firstName = name ? name.split(' ')[0] : 'there';
  return [
    `Hi ${firstName},`,
    '',
    `30 days ago, you submitted a compensation claim to ${airline || 'your airline'}${flightNumber ? ` for flight ${flightNumber}` : ''}. If you haven't heard back — or if they rejected your claim — we can take it from here.`,
    '',
    compensationAmount ? `You may be entitled to ${compensationAmount} in compensation.` : '',
    '',
    'Our managed service handles follow-ups, escalation to ' + authority + ', and legal action if needed — all at no upfront cost.',
    '',
    '25% of your compensation, only if we win. No hidden fees, ever.',
    '',
    'Let us handle it: https://getflightcomp.com',
    '',
    '---',
    'You received this because you purchased a Flight Compensation Kit from FlightComp.',
    'To unsubscribe, reply with "unsubscribe" or email support@getflightcomp.com',
  ].filter(l => l !== null).join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  const dataDir          = path.join(process.cwd(), 'data');
  const purchasesPath    = path.join(dataDir, 'kit-purchases.json');
  const sentPath         = path.join(dataDir, 'sent-followups.json');

  // Load purchases
  let purchases = [];
  if (fs.existsSync(purchasesPath)) {
    try { purchases = JSON.parse(fs.readFileSync(purchasesPath, 'utf8')); } catch { /* empty */ }
  }

  // Load already-sent log (keyed by email)
  let sent = {};
  if (fs.existsSync(sentPath)) {
    try { sent = JSON.parse(fs.readFileSync(sentPath, 'utf8')); } catch { /* empty */ }
  }

  const now = Date.now();
  const results = { sent: [], skipped: [], errors: [] };

  for (const purchase of purchases) {
    const { email, purchaseDate, managedServiceSignup } = purchase;

    // Skip if already signed up for managed service
    if (managedServiceSignup) {
      results.skipped.push({ email, reason: 'managed_service_signup' });
      continue;
    }

    // Skip if follow-up already sent
    if (sent[email]) {
      results.skipped.push({ email, reason: 'already_sent' });
      continue;
    }

    // Check if exactly ~30 days ago (between 29.5 and 30.5 days)
    const purchasedAt = new Date(purchaseDate).getTime();
    const ageMs = now - purchasedAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 29.5 || ageDays > 30.5) {
      results.skipped.push({ email, reason: `age_${Math.round(ageDays)}_days` });
      continue;
    }

    try {
      await sendEmail({
        to: email,
        subject: `No response from ${purchase.airline || 'your airline'}? Let us take over.`,
        html: buildEmailHtml(purchase),
        text: buildEmailText(purchase),
      });

      // Mark as sent
      sent[email] = { sentAt: new Date().toISOString(), flightNumber: purchase.flightNumber };
      results.sent.push(email);
    } catch (err) {
      console.error('[kit-followup] Failed to send to', email, err);
      results.errors.push({ email, error: String(err) });
    }
  }

  // Persist sent log
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(sentPath, JSON.stringify(sent, null, 2));

  return res.status(200).json({
    ok: true,
    sent:    results.sent.length,
    skipped: results.skipped.length,
    errors:  results.errors.length,
    details: results,
  });
}
