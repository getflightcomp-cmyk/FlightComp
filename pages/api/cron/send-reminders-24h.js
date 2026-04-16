/**
 * GET /api/cron/send-reminders-24h
 *
 * Sends a 24-hour reminder email to users who:
 *   - Captured between 23 and 25 hours ago
 *   - Have an eligibility_verdict of 'likely' or 'possibly'
 *   - Have NOT yet converted (converted_at IS NULL)
 *   - Have NOT unsubscribed (unsubscribed_at IS NULL)
 *   - Have NOT already received this reminder (reminder_24h_sent_at IS NULL)
 *
 * Secured by CRON_SECRET in the Authorization header.
 * Register in Vercel: "0 * * * *" (runs every hour, picks up the 23-25h window).
 */

import { adminClient } from '../../../lib/supabase';
import { sendEmail }   from '../../../lib/email';

function buildHtml({ email, airline, compensationAmount, regulation }) {
  const firstName   = '';
  const compLine    = compensationAmount
    ? `You may be entitled to <strong>${compensationAmount}</strong> in compensation.`
    : 'You may be entitled to statutory compensation.';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;max-width:600px;width:100%;">

        <tr><td style="background:#0c447c;padding:24px 32px;">
          <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">FlightComp</p>
          <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Flight Compensation Specialists</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hi there,</p>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            Yesterday you checked your eligibility for a compensation claim
            ${airline ? `against <strong>${airline}</strong>` : 'for a disrupted flight'}.
            ${compLine}
          </p>

          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 24px;">
            Our <strong>Flight Compensation Kit</strong> gives you everything you need to claim on your own:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#e6f1fb;border-radius:6px;margin:0 0 24px;">
            <tr><td style="padding:20px 24px;">
              <ul style="font-size:14px;color:#334155;margin:0;padding-left:20px;line-height:1.9;">
                <li>Personalised claim letter (ready to send)</li>
                <li>Step-by-step airline submission guide</li>
                <li>14-day follow-up template</li>
                <li>30-day escalation template</li>
                <li>What to Expect guide</li>
              </ul>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c447c;border-radius:6px;margin:0 0 24px;">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="color:#c3daf8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">One-time cost</p>
              <p style="color:#fff;font-size:24px;font-weight:bold;margin:0;">$14.99</p>
              <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Instant PDF download &mdash; claim at your own pace</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px;">
              <a href="https://getflightcomp.com" style="display:inline-block;background:#3b82f6;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 36px;border-radius:6px;">
                Get My Compensation Kit
              </a>
            </td></tr>
          </table>

          <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0;">
            Airlines count on passengers not following up. Don't let them keep what's yours.
          </p>
        </td></tr>

        <tr><td style="background:#f1f5f9;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;line-height:1.6;">
            You received this because you checked your flight compensation eligibility at FlightComp.
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            <a href="https://getflightcomp.com" style="color:#94a3b8;">getflightcomp.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://getflightcomp.com/unsubscribe?token=__TOKEN__" style="color:#94a3b8;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText({ airline, compensationAmount }) {
  const compLine = compensationAmount
    ? `You may be entitled to ${compensationAmount} in compensation.`
    : 'You may be entitled to statutory compensation.';
  return [
    'Hi there,',
    '',
    `Yesterday you checked your eligibility for a compensation claim${airline ? ` against ${airline}` : ''}. ${compLine}`,
    '',
    'Our Flight Compensation Kit ($14.99) gives you everything you need to claim on your own:',
    '  • Personalised claim letter',
    '  • Step-by-step airline submission guide',
    '  • 14-day follow-up template',
    '  • 30-day escalation template',
    '  • What to Expect guide',
    '',
    'Get your kit: https://getflightcomp.com',
    '',
    "Airlines count on passengers not following up. Don't let them keep what's yours.",
    '',
    '---',
    'You received this because you checked your eligibility at FlightComp.',
    'Unsubscribe: https://getflightcomp.com/unsubscribe?token=__TOKEN__',
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  // Verify cron secret
  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const now       = new Date();
  const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23h ago
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25h ago

  // Query eligible rows
  const { data: rows, error } = await adminClient
    .from('email_captures')
    .select('id, email, airline, compensation_amount, regulation, unsubscribe_token')
    .in('eligibility_verdict', ['likely', 'possibly'])
    .is('converted_at',          null)
    .is('unsubscribed_at',       null)
    .is('reminder_24h_sent_at',  null)
    .gte('captured_at', windowStart.toISOString())
    .lte('captured_at', windowEnd.toISOString());

  if (error) {
    console.error('[send-reminders-24h] Query failed:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const results = { sent: [], skipped: [], errors: [] };

  for (const row of rows || []) {
    const token = row.unsubscribe_token || '';
    const html  = buildHtml({
      airline:            row.airline,
      compensationAmount: row.compensation_amount,
      regulation:         row.regulation,
    }).replace(/__TOKEN__/g, token);

    const text = buildText({
      airline:            row.airline,
      compensationAmount: row.compensation_amount,
    }).replace(/__TOKEN__/g, token);

    try {
      await sendEmail({
        to:      row.email,
        subject: row.airline
          ? `Your ${row.airline} compensation claim — don't miss your window`
          : 'Your flight compensation claim — don\'t miss your window',
        html,
        text,
      });

      await adminClient
        .from('email_captures')
        .update({ reminder_24h_sent_at: new Date().toISOString() })
        .eq('id', row.id);

      results.sent.push(row.email);
    } catch (err) {
      console.error('[send-reminders-24h] Failed for', row.email, err.message);
      results.errors.push({ email: row.email, error: String(err) });
    }
  }

  console.log('[send-reminders-24h]', results);
  return res.status(200).json({ ok: true, ...results });
}
