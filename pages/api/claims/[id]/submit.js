import { sendEmail } from '../../../../lib/email';
import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

function passengerConfirmHtml(claim) {
  const deadlineDays = claim.regulation === 'APPR' ? 30 : 14;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;border:1px solid #e2e8f0;max-width:600px;width:100%;">
        <tr><td style="background:#0c447c;padding:24px 32px;">
          <p style="color:#fff;font-size:20px;font-weight:bold;margin:0;">FlightComp</p>
          <p style="color:#c3daf8;font-size:13px;margin:6px 0 0;">Claim Submitted</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Hi ${claim.passengerName},</p>
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            Your compensation claim has been submitted to <strong>${claim.airline}</strong>.
            We're monitoring for a response and will follow up if needed.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:6px;margin:0 0 24px;">
            <tr><td style="padding:16px;">
              <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#334155;">
                <tr><td style="font-weight:600;width:40%;">Airline</td><td>${claim.airline}</td></tr>
                <tr><td style="font-weight:600;">Flight</td><td>${claim.flightNumber} · ${claim.flightDate}</td></tr>
                <tr><td style="font-weight:600;">Route</td><td>${claim.departureAirport} → ${claim.arrivalAirport}</td></tr>
                <tr><td style="font-weight:600;">Disruption</td><td>${claim.disruptionType}</td></tr>
                <tr><td style="font-weight:600;">Claim ID</td><td style="font-family:monospace;font-size:12px;">${claim.id}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
            You'll hear from us within <strong>${deadlineDays} days</strong>.
            If the airline doesn't respond, we'll follow up automatically.
          </p>
          <p style="font-size:14px;color:#64748b;margin:0;">
            Questions? <a href="mailto:support@getflightcomp.com" style="color:#0c447c;">support@getflightcomp.com</a>
          </p>
        </td></tr>
        <tr><td style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">Operated by Noontide Ventures LLC · getflightcomp.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  let claim = await getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status !== 'letter_generated') {
    return res.status(400).json({ error: `Cannot submit: claim is in status '${claim.status}'` });
  }
  if (!claim.claimLetterText) {
    return res.status(400).json({ error: 'No claim letter found — generate letter first' });
  }

  const subject = `${claim.regulation} Compensation Claim — ${claim.passengerName} — Flight ${claim.flightNumber} ${claim.flightDate}`;
  const now = new Date().toISOString();
  let submittedVia;

  if (claim.airlineEmail) {
    if (claim.isTestClaim) {
      claim = addEvent(claim, 'submit_simulated',
        `TEST MODE: Email to ${claim.airlineEmail} was NOT sent.\nSubject: ${subject}\nFrom: support@getflightcomp.com`
      );
    } else {
      try {
        await sendEmail({
          to:      claim.airlineEmail,
          subject,
          html:    `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6;">${claim.claimLetterText.replace(/</g, '&lt;')}</pre>`,
          text:    claim.claimLetterText,
        });
        claim = addEvent(claim, 'email_sent',
          `Claim letter sent to ${claim.airlineEmail}.`
        );
      } catch (err) {
        console.error('[claims/submit] Airline email failed:', err);
        return res.status(500).json({ error: 'Failed to send claim to airline' });
      }
    }
    submittedVia = 'email';
  } else {
    // Form-only airline — flag for manual admin submission
    submittedVia = 'form_manual';
    claim = addEvent(claim, 'manual_submission_required',
      `${claim.airline} has no direct claims email. MANUAL SUBMISSION REQUIRED via: ${claim.airlineFormUrl || 'airline website'}. Go to the airline's web form, paste the claim letter, and click "Mark as Submitted" when done.`
    );
  }

  claim = {
    ...claim,
    status:      'awaiting_response',
    submittedAt: now,
    submittedVia,
    updatedAt:   now,
  };
  claim = addEvent(claim, 'status_changed', `Status → awaiting_response. Submitted via: ${submittedVia}.`);

  // Confirmation email to passenger (always — they should not know if email or form)
  try {
    await sendEmail({
      to:      claim.passengerEmail,
      subject: `Your claim has been submitted to ${claim.airline}`,
      html:    passengerConfirmHtml(claim),
      text:    `Hi ${claim.passengerName},\n\nYour compensation claim has been submitted to ${claim.airline}. We're monitoring for a response and will follow up if needed.\n\nFlight: ${claim.flightNumber} · ${claim.flightDate}\nRoute: ${claim.departureAirport} → ${claim.arrivalAirport}\nClaim ID: ${claim.id}\n\nYou'll hear from us within ${claim.regulation === 'APPR' ? 30 : 14} days.\n\n— FlightComp (Noontide Ventures LLC)`,
    });
    claim = addEvent(claim, 'passenger_notified', `Submission confirmation sent to ${claim.passengerEmail}.`);
  } catch (err) {
    console.error('[claims/submit] Passenger confirmation email failed:', err);
    // Non-fatal
  }

  await saveClaim(claim);
  return res.status(200).json({ ok: true, claim });
}
