import Anthropic from '@anthropic-ai/sdk';
import { sendEmail } from '../../../../lib/email';
import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AUTHORITY = {
  EU261: {
    name:      'Relevant EU National Enforcement Body (NEB)',
    shortName: 'EU NEB',
    note:      'NEB depends on country of departure. File at the NEB of the EU country where the disrupted flight departed. List at: https://transport.ec.europa.eu/transport-modes/air/passenger-rights/national-enforcement-bodies_en',
    email:     null,
  },
  UK261: {
    name:      'UK Civil Aviation Authority (CAA)',
    shortName: 'UK CAA',
    note:      'File a complaint at www.caa.co.uk/passengers/resolving-travel-problems/delays-and-cancellations',
    email:     null,
  },
  APPR: {
    name:      'Canadian Transportation Agency (CTA)',
    shortName: 'CTA',
    note:      'File at otc-cta.gc.ca/eng/air-travel-complaints',
    email:     null,
  },
  SHY: {
    name:      'Turkish Directorate General of Civil Aviation (DGCA/SHGM)',
    shortName: 'SHGM',
    note:      'File a complaint at web.shgm.gov.tr. Include all correspondence and flight documentation.',
    email:     null,
  },
};

function buildEscalationPrompt(claim, auth) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const submittedDate = claim.submittedAt
    ? new Date(claim.submittedAt).toLocaleDateString('en-GB') : 'previously';
  const followUpDates = claim.lastFollowUpDate
    ? `Last follow-up: ${new Date(claim.lastFollowUpDate).toLocaleDateString('en-GB')}` : '';

  return `Write a formal regulatory complaint/escalation letter to a national aviation authority.

CONTEXT:
- Claimant: ${claim.passengerName} (represented by Noontide Ventures LLC / FlightComp)
- Airline: ${claim.airline}
- Flight: ${claim.flightNumber} on ${claim.flightDate}
- Route: ${claim.departureAirport} → ${claim.arrivalAirport}
- Disruption: ${claim.disruptionType}
- Regulation: ${claim.regulation}
${claim.bookingReference ? `- Booking reference: ${claim.bookingReference}` : ''}
${claim.description ? `- Disruption details: ${claim.description}` : ''}
- Original claim submitted to airline: ${submittedDate}
- Number of follow-up letters sent: ${claim.followUpCount}
${followUpDates}
- Airline response: ${claim.airlineResponseReceived ? `Received (${claim.airlineResponseClassification}): ${claim.airlineResponseSummary}` : 'No response received'}
- Escalating to: ${auth.name}

REQUIREMENTS:
1. Date: ${today}
2. Addressed to: ${auth.name}
3. Written by Noontide Ventures LLC / FlightComp as duly authorised representative of ${claim.passengerName}
4. Include: full claim chronology — original claim date, airline responses (or silence), follow-up letters
5. Clearly state statutory entitlement under ${claim.regulation} and the exact compensation owed
6. Request that the authority investigate and compel ${claim.airline} to comply with its obligations
7. Note: all prior correspondence is enclosed (state this in the letter)
8. Include all flight and disruption details for reference
9. Professional, formal regulatory complaint style
10. All correspondence to support@getflightcomp.com; cc claim file reference: ${claim.id}
11. Close: "Yours faithfully,\n\nNoontide Ventures LLC\noperating as FlightComp\non behalf of ${claim.passengerName}"
12. Complete letter only — no preamble or meta-text

Write the escalation letter now:`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  let claim = await getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status === 'resolved') {
    return res.status(400).json({ error: 'Cannot escalate a resolved claim' });
  }

  const auth = AUTHORITY[claim.regulation] || AUTHORITY.EU261;

  let letterText;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildEscalationPrompt(claim, auth) }],
    });
    letterText = message.content[0]?.text || '';
    if (!letterText) throw new Error('Empty response');
  } catch (err) {
    console.error('[claims/escalate] Letter generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate escalation letter' });
  }

  const now = new Date().toISOString();
  claim = addEvent(claim, 'escalation_letter_generated',
    `Escalation letter generated for ${auth.name}. ${auth.note}. Manual submission required — no automated sending to NEBs/CTA.`
  );

  claim = {
    ...claim,
    claimLetterText:      letterText,
    status:               'escalated',
    escalatedToAuthority: true,
    escalationAuthority:  auth.shortName,
    escalationDate:       now,
    updatedAt:            now,
  };

  // Notify passenger
  try {
    await sendEmail({
      to:      claim.passengerEmail,
      subject: `Your claim has been escalated to ${auth.shortName}`,
      html:    `<p style="font-family:Arial,sans-serif;">Hi ${claim.passengerName},</p><p style="font-family:Arial,sans-serif;line-height:1.6;">We've escalated your claim to <strong>${auth.name}</strong>. They typically respond within 30–90 days. We'll keep you informed of any developments.</p><p style="font-family:Arial,sans-serif;font-size:13px;color:#666;">${auth.note}</p><p style="font-family:Arial,sans-serif;">— FlightComp</p>`,
      text:    `Hi ${claim.passengerName},\n\nWe've escalated your claim to ${auth.name}. They typically respond within 30–90 days.\n\n${auth.note}\n\n— FlightComp`,
    });
    claim = addEvent(claim, 'passenger_notified', `Passenger notified of escalation to ${auth.shortName}.`);
  } catch (err) {
    console.error('[claims/escalate] Passenger email failed:', err);
  }

  await saveClaim(claim);
  return res.status(200).json({ ok: true, claim, authority: auth });
}
