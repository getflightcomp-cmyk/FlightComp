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
    ? `you may be entitled to <strong>${compensationAmount}</strong> in compensation`
    : 'you may be entitled to statutory compensation';

  const flightRef = flightNumber ? ` for flight ${flightNumber}` : '';
  const airlineRef = airline || 'your airline';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ffffff;margin:0;padding:0;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <tr><td>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        It's been about 30 days since you submitted your claim to ${airlineRef}${flightRef}. Just checking in — ${compLine}, and I want to make sure you're getting a response.
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        If the airline hasn't responded or has rejected your claim, your next step is to escalate to ${authority}. The kit you downloaded includes the 30-day escalation template for this.
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        If you'd rather have someone handle the escalation for you, we also offer a managed service — no upfront cost, 25% of your compensation only if we win:
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        <a href="https://getflightcomp.com" style="color:#2563eb;">https://getflightcomp.com</a>
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        If you've already been paid or resolved your claim, congrats — no action needed.
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        Thanks,<br>
        Ethan<br>
        FlightComp
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">

      <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">
        You received this because you purchased a Flight Compensation Kit from
        <a href="https://getflightcomp.com" style="color:#64748b;">getflightcomp.com</a>.
        If you don't want to receive follow-ups like this,
        <a href="https://getflightcomp.com/unsubscribe?token=__TOKEN__" style="color:#64748b;">unsubscribe here</a>.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText({ name, airline, flightNumber, regulation, compensationAmount }) {
  const authority = getAuthority(regulation);
  const firstName = name ? name.split(' ')[0] : 'there';
  const flightRef = flightNumber ? ` for flight ${flightNumber}` : '';
  const airlineRef = airline || 'your airline';
  const compLine = compensationAmount
    ? `you may be entitled to ${compensationAmount} in compensation`
    : 'you may be entitled to statutory compensation';

  return [
    `Hi ${firstName},`,
    '',
    `It's been about 30 days since you submitted your claim to ${airlineRef}${flightRef}. Just checking in — ${compLine}, and I want to make sure you're getting a response.`,
    '',
    `If the airline hasn't responded or has rejected your claim, your next step is to escalate to ${authority}. The kit you downloaded includes the 30-day escalation template for this.`,
    '',
    "If you'd rather have someone handle the escalation for you, we also offer a managed service — no upfront cost, 25% of your compensation only if we win:",
    '',
    'https://getflightcomp.com',
    '',
    "If you've already been paid or resolved your claim, congrats — no action needed.",
    '',
    'Thanks,',
    'Ethan',
    'FlightComp',
    '',
    '---',
    'You received this because you purchased a Flight Compensation Kit from getflightcomp.com.',
    'Unsubscribe: https://getflightcomp.com/unsubscribe?token=__TOKEN__',
  ].join('\n');
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

    const token = purchase.unsubscribeToken || '';
    const html  = buildEmailHtml(purchase).replace(/__TOKEN__/g, token);
    const text  = buildEmailText(purchase).replace(/__TOKEN__/g, token);

    const unsubscribeUrl = `https://getflightcomp.com/unsubscribe?token=${token}`;
    const emailHeaders = {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@getflightcomp.com>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Precedence': 'bulk',
    };

    try {
      await sendEmail({
        to:      email,
        subject: purchase.airline
          ? `Checking in on your ${purchase.airline} claim`
          : 'Checking in on your flight claim',
        html,
        text,
        headers: emailHeaders,
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
