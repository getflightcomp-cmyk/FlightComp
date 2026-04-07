import Anthropic from '@anthropic-ai/sdk';
import { sendEmail } from '../../../../lib/email';
import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildRebuttalPrompt(claim, responseSummary) {
  const deadlineDays = claim.regulation === 'APPR' ? 30 : 14;
  const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const caselaw = {
    EU261: 'Wallentin-Hermann v Alitalia (C-549/07, narrow extraordinary circumstances defense), Sturgeon v Condor (C-402/07, delays of 3+ hours = cancellation for compensation)',
    UK261: 'Wallentin-Hermann v Alitalia (C-549/07), Sturgeon v Condor (C-402/07) as applied under UK law post-Brexit',
    APPR:  'CTA guidance on Section 23 extraordinary circumstances (narrow interpretation); controllable vs. safety-related distinction',
    SHY:   'Turkish Civil Aviation Law No. 2920 and SHGM circulars on force majeure (narrow interpretation)',
  }[claim.regulation] || '';

  const authority = {
    EU261: 'the relevant National Enforcement Body (NEB)',
    UK261: 'the UK Civil Aviation Authority (CAA)',
    APPR:  'the Canadian Transportation Agency (CTA)',
    SHY:   'the Turkish SHGM',
  }[claim.regulation] || 'the relevant authority';

  return `Write a firm rebuttal letter to an airline that has rejected a compensation claim.

CONTEXT:
- Claimant: ${claim.passengerName} (represented by Noontide Ventures LLC / FlightComp)
- Airline: ${claim.airline}
- Flight: ${claim.flightNumber} on ${claim.flightDate}
- Route: ${claim.departureAirport} → ${claim.arrivalAirport}
- Disruption: ${claim.disruptionType}
- Regulation: ${claim.regulation}
${claim.bookingReference ? `- Booking reference: ${claim.bookingReference}` : ''}
${claim.description ? `- Disruption details: ${claim.description}` : ''}

AIRLINE'S STATED REASON FOR REJECTION:
${responseSummary}

RELEVANT CASE LAW / LEGAL STANDARDS:
${caselaw}

LETTER REQUIREMENTS:
1. Date: ${today}
2. Written by Noontide Ventures LLC / FlightComp as authorised representative of ${claim.passengerName}
3. Reference the original claim and this rejection by date
4. Directly and specifically rebut the airline's stated reason using the relevant case law above
5. Distinguish extraordinary circumstances from operational difficulties the airline should manage
6. Assert statutory entitlement under ${claim.regulation}
7. Demand a response and payment within ${deadlineDays} days (${deadline})
8. State that refusal will result in escalation to ${authority}
9. Professional but firm — a persuasive legal argument, not aggressive
10. Direct all correspondence to support@getflightcomp.com
11. Close: "Yours faithfully,\n\nNoontide Ventures LLC\noperating as FlightComp\non behalf of ${claim.passengerName}"
12. Write the complete letter only — no preamble

Write the rebuttal now:`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  const { classification, summary, responseDate } = req.body || {};

  if (!['accepted', 'rejected', 'more_info'].includes(classification)) {
    return res.status(400).json({ error: 'classification must be accepted, rejected, or more_info' });
  }
  if (!summary?.trim()) return res.status(400).json({ error: 'summary is required' });

  let claim = getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  const now = new Date().toISOString();
  claim = {
    ...claim,
    airlineResponseReceived:       true,
    airlineResponseDate:           responseDate || now,
    airlineResponseSummary:        summary,
    airlineResponseClassification: classification,
    updatedAt: now,
  };
  claim = addEvent(claim, 'response_received',
    `Airline response recorded. Classification: ${classification}. Summary: "${summary}"`,
    'admin'
  );

  if (classification === 'accepted') {
    claim = { ...claim, status: 'accepted' };
    claim = addEvent(claim, 'status_changed', 'Status → accepted.');

    const feeAmt = claim.estimatedCompensation
      ? Math.round(claim.estimatedCompensation * claim.feePercentage / 100)
      : null;
    const feeNote = feeAmt
      ? `Our ${claim.feePercentage}% fee (${claim.currency === 'EUR' ? '€' : claim.currency === 'GBP' ? '£' : 'CAD $'}${feeAmt}) will be invoiced separately.`
      : `Our ${claim.feePercentage}% fee will be invoiced separately once payment is confirmed.`;

    try {
      await sendEmail({
        to: claim.passengerEmail,
        subject: `Great news — ${claim.airline} has agreed to pay your compensation`,
        html:  `<p style="font-family:Arial,sans-serif;">Hi ${claim.passengerName},</p><p style="font-family:Arial,sans-serif;line-height:1.6;">Great news! <strong>${claim.airline}</strong> has agreed to pay your compensation. We'll confirm once payment is received. ${feeNote}</p><p style="font-family:Arial,sans-serif;">— FlightComp</p>`,
        text:  `Hi ${claim.passengerName},\n\nGreat news! ${claim.airline} has agreed to pay your compensation. We'll confirm when payment is received. ${feeNote}\n\n— FlightComp`,
      });
      claim = addEvent(claim, 'passenger_notified', 'Passenger notified: claim accepted.');
    } catch (err) {
      console.error('[claims/response] Email failed:', err);
    }

  } else if (classification === 'rejected') {
    claim = { ...claim, status: 'rejected' };
    claim = addEvent(claim, 'status_changed', 'Status → rejected. Drafting rebuttal.');

    // Draft rebuttal via Claude
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildRebuttalPrompt(claim, summary) }],
      });
      const rebuttal = message.content[0]?.text || '';
      if (rebuttal) {
        claim = { ...claim, claimLetterText: rebuttal };
        claim = addEvent(claim, 'rebuttal_drafted',
          `Rebuttal letter drafted (${rebuttal.length} chars). Ready to send via Send Follow-up.`
        );
      }
    } catch (err) {
      console.error('[claims/response] Rebuttal draft failed:', err);
    }

    try {
      await sendEmail({
        to: claim.passengerEmail,
        subject: `${claim.airline} denied your claim — we're preparing a rebuttal`,
        html:  `<p style="font-family:Arial,sans-serif;">Hi ${claim.passengerName},</p><p style="font-family:Arial,sans-serif;line-height:1.6;"><strong>${claim.airline}</strong> has initially denied your claim. This is common — many claims succeed on follow-up. We're preparing a rebuttal and will be in touch shortly.</p><p style="font-family:Arial,sans-serif;">— FlightComp</p>`,
        text:  `Hi ${claim.passengerName},\n\n${claim.airline} has initially denied your claim. This is common — we're preparing a rebuttal. Many claims succeed on follow-up.\n\n— FlightComp`,
      });
      claim = addEvent(claim, 'passenger_notified', 'Passenger notified: rejection + rebuttal in progress.');
    } catch (err) {
      console.error('[claims/response] Email failed:', err);
    }

  } else if (classification === 'more_info') {
    claim = { ...claim, status: 'more_info_needed' };
    claim = addEvent(claim, 'status_changed', 'Status → more_info_needed.');

    try {
      await sendEmail({
        to: claim.passengerEmail,
        subject: `${claim.airline} has requested additional information`,
        html:  `<p style="font-family:Arial,sans-serif;">Hi ${claim.passengerName},</p><p style="font-family:Arial,sans-serif;line-height:1.6;"><strong>${claim.airline}</strong> has requested additional information about your claim. We'll review what they need and may reach out to you for details.</p><p style="font-family:Arial,sans-serif;">— FlightComp</p>`,
        text:  `Hi ${claim.passengerName},\n\n${claim.airline} has requested additional information about your claim. We'll review and may reach out.\n\n— FlightComp`,
      });
      claim = addEvent(claim, 'passenger_notified', 'Passenger notified: more info requested.');
    } catch (err) {
      console.error('[claims/response] Email failed:', err);
    }
  }

  saveClaim(claim);
  return res.status(200).json({ ok: true, claim });
}
