/**
 * GET /api/cron/send-reminders-24h
 *
 * Sends a 24-hour reminder email to users who:
 *   - Captured between 12 and 36 hours ago
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
  const compLine = compensationAmount
    ? `Based on what you entered, you may be entitled to <strong>${compensationAmount}</strong> in statutory compensation.`
    : 'Based on what you entered, you may be entitled to statutory compensation.';

  const airlinePhrase = airline
    ? `your ${airline} flight`
    : 'your disrupted flight';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#ffffff;margin:0;padding:0;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <tr><td>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi,</p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        Following up on ${airlinePhrase} yesterday. ${compLine}
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        If you'd like a ready-to-send claim letter with submission instructions and follow-up templates, our Flight Compensation Kit is $14.99 and downloads as a PDF. You can find it here:
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        <a href="https://getflightcomp.com" style="color:#2563eb;">https://getflightcomp.com</a>
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        If you've already filed your claim, or you'd rather handle it differently, no problem — you can ignore this email.
      </p>

      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
        Thanks,<br>
        Ethan<br>
        FlightComp
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">

      <p style="font-size:12px;color:#64748b;line-height:1.6;margin:0;">
        You received this because you checked your flight compensation eligibility at
        <a href="https://getflightcomp.com" style="color:#64748b;">getflightcomp.com</a>.
        If you don't want to receive follow-ups like this,
        <a href="https://getflightcomp.com/unsubscribe?token=__TOKEN__" style="color:#64748b;">unsubscribe here</a>.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText({ airline, compensationAmount }) {
  const compLine = compensationAmount
    ? `Based on what you entered, you may be entitled to ${compensationAmount} in statutory compensation.`
    : 'Based on what you entered, you may be entitled to statutory compensation.';
  const airlinePhrase = airline ? `your ${airline} flight` : 'your disrupted flight';

  return [
    'Hi,',
    '',
    `Following up on ${airlinePhrase} yesterday. ${compLine}`,
    '',
    "If you'd like a ready-to-send claim letter with submission instructions and follow-up templates, our Flight Compensation Kit is $14.99 and downloads as a PDF. You can find it here:",
    '',
    'https://getflightcomp.com',
    '',
    "If you've already filed your claim, or you'd rather handle it differently, no problem — you can ignore this email.",
    '',
    'Thanks,',
    'Ethan',
    'FlightComp',
    '',
    '---',
    'You received this because you checked your flight compensation eligibility at getflightcomp.com.',
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

  const now         = new Date();
  const windowEnd   = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12h ago
  const windowStart = new Date(now.getTime() - 36 * 60 * 60 * 1000); // 36h ago

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

    const unsubscribeUrl = `https://getflightcomp.com/unsubscribe?token=${token}`;
    const emailHeaders = {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@getflightcomp.com>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'Precedence': 'bulk',
    };

    try {
      await sendEmail({
        to:      row.email,
        subject: row.airline
          ? `Quick follow-up on your ${row.airline} flight`
          : 'Quick follow-up on your flight',
        html,
        text,
        headers: emailHeaders,
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
