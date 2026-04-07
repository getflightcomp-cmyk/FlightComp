import Anthropic from '@anthropic-ai/sdk';
import { sendEmail } from '../../../../lib/email';
import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AUTHORITY_NAMES = {
  EU261: 'the relevant National Enforcement Body (NEB)',
  UK261: 'the UK Civil Aviation Authority (CAA)',
  APPR:  'the Canadian Transportation Agency (CTA)',
  SHY:   'the Turkish Directorate General of Civil Aviation (SHGM)',
};

function buildNoResponsePrompt(claim) {
  const deadlineDays = claim.regulation === 'APPR' ? 30 : 14;
  const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const authority = AUTHORITY_NAMES[claim.regulation] || AUTHORITY_NAMES.EU261;
  const originalDate = claim.submittedAt
    ? new Date(claim.submittedAt).toLocaleDateString('en-GB') : 'previously';

  return `Write a firm follow-up letter to an airline that has not responded to a compensation claim.

CONTEXT:
- Claimant: ${claim.passengerName} (represented by Noontide Ventures LLC / FlightComp)
- Airline: ${claim.airline}
- Flight: ${claim.flightNumber} on ${claim.flightDate}
- Route: ${claim.departureAirport} → ${claim.arrivalAirport}
- Disruption: ${claim.disruptionType}
- Regulation: ${claim.regulation}
- Original claim submitted: ${originalDate}
- Follow-up number: ${(claim.followUpCount || 0) + 1}

REQUIREMENTS:
1. Date: ${today}
2. Written by Noontide Ventures LLC / FlightComp as authorised representative of ${claim.passengerName}
3. Reference the original claim and the date it was submitted
4. Note that the required ${deadlineDays}-day response deadline has passed without reply
5. Assert statutory entitlement under ${claim.regulation}
6. Issue a final deadline: ${deadline} (${deadlineDays} days from today)
7. State explicitly that non-compliance will result in immediate escalation to ${authority}
8. Tone: formal, urgent, final notice before regulatory action
9. All correspondence to support@getflightcomp.com
10. Close: "Yours faithfully,\n\nNoontide Ventures LLC\noperating as FlightComp\non behalf of ${claim.passengerName}"
11. Complete letter only — no preamble

Write the letter now:`;
}

function buildRejectionFollowUpPrompt(claim) {
  const deadlineDays = claim.regulation === 'APPR' ? 30 : 14;
  const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const authority = AUTHORITY_NAMES[claim.regulation] || AUTHORITY_NAMES.EU261;

  const caselaw = {
    EU261: 'Wallentin-Hermann v Alitalia (C-549/07): only truly unforeseeable events beyond the airline\'s control qualify as extraordinary circumstances; Sturgeon v Condor (C-402/07): delays of 3+ hours confer the same compensation rights as cancellations',
    UK261: 'Wallentin-Hermann v Alitalia and Sturgeon v Condor, as applied under UK retained EU law',
    APPR:  'CTA jurisprudence: Section 23 extraordinary circumstances are narrowly construed; airlines must demonstrate specific unforeseeable events outside their control',
    SHY:   'Turkish Civil Aviation Law No. 2920, Article 143 and SHGM circulars: force majeure is narrowly interpreted',
  }[claim.regulation] || '';

  return `Write a follow-up rebuttal letter (follow-up #${(claim.followUpCount || 0) + 1}) maintaining a compensation claim after rejection.

CONTEXT:
- Claimant: ${claim.passengerName} (represented by Noontide Ventures LLC / FlightComp)
- Airline: ${claim.airline}
- Flight: ${claim.flightNumber} on ${claim.flightDate}
- Route: ${claim.departureAirport} → ${claim.arrivalAirport}
- Disruption: ${claim.disruptionType}
- Regulation: ${claim.regulation}
${claim.bookingReference ? `- Booking reference: ${claim.bookingReference}` : ''}
- Airline's rejection reason: ${claim.airlineResponseSummary || 'not specified'}
- Prior correspondence: ${claim.followUpCount} previous follow-up(s)

CASE LAW TO CITE:
${caselaw}

REQUIREMENTS:
1. Date: ${today}
2. Written by Noontide Ventures LLC / FlightComp as authorised representative
3. Reference the chain of prior correspondence
4. Forcefully rebut the airline's position using the case law above
5. Emphasise that the airline bears the burden of proving extraordinary circumstances
6. This is a final opportunity to resolve before regulatory escalation
7. Demand full response and payment within ${deadlineDays} days (${deadline})
8. State escalation to ${authority} will follow if not resolved
9. Firm, professional, legally precise
10. All correspondence to support@getflightcomp.com
11. Close: "Yours faithfully,\n\nNoontide Ventures LLC\noperating as FlightComp\non behalf of ${claim.passengerName}"
12. Complete letter only — no preamble

Write the letter now:`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  let claim = getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  const validStatuses = ['awaiting_response', 'rejected', 'followup_sent', 'more_info_needed'];
  if (!validStatuses.includes(claim.status)) {
    return res.status(400).json({ error: `Cannot send follow-up for claim in status '${claim.status}'` });
  }

  const isNoResponse = !claim.airlineResponseReceived;
  const prompt = isNoResponse ? buildNoResponsePrompt(claim) : buildRejectionFollowUpPrompt(claim);

  let letterText;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    letterText = message.content[0]?.text || '';
    if (!letterText) throw new Error('Empty response');
  } catch (err) {
    console.error('[claims/followup] Letter generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate follow-up letter' });
  }

  const now = new Date().toISOString();
  const newCount = (claim.followUpCount || 0) + 1;
  const subject = `Follow-up ${newCount}: ${claim.regulation} Compensation Claim — ${claim.passengerName} — Flight ${claim.flightNumber}`;

  if (claim.airlineEmail) {
    if (claim.isTestClaim) {
      claim = addEvent(claim, 'followup_simulated',
        `TEST MODE: Follow-up #${newCount} to ${claim.airlineEmail} was NOT sent.\nSubject: ${subject}`
      );
    } else {
      try {
        await sendEmail({
          to:      claim.airlineEmail,
          subject,
          html:    `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;line-height:1.6;">${letterText.replace(/</g, '&lt;')}</pre>`,
          text:    letterText,
        });
        claim = addEvent(claim, 'followup_sent', `Follow-up #${newCount} sent to ${claim.airlineEmail}.`);
      } catch (err) {
        console.error('[claims/followup] Email send failed:', err);
        return res.status(500).json({ error: 'Failed to send follow-up email' });
      }
    }
  } else {
    claim = addEvent(claim, 'followup_manual_required',
      `Follow-up #${newCount} generated. Manual submission required via: ${claim.airlineFormUrl || 'airline website'}.`
    );
  }

  claim = {
    ...claim,
    claimLetterText:  letterText,
    status:           'followup_sent',
    followUpCount:    newCount,
    lastFollowUpDate: now,
    updatedAt:        now,
  };

  if (newCount >= 2) {
    claim = addEvent(claim, 'escalation_flagged',
      `${newCount} follow-ups sent with no resolution. Claim is flagged for escalation to the aviation authority.`
    );
  }

  saveClaim(claim);
  return res.status(200).json({ ok: true, claim, readyForEscalation: newCount >= 2 });
}
