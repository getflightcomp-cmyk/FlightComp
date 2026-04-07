import Anthropic from '@anthropic-ai/sdk';
import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEADLINE_DAYS = { EU261: 14, UK261: 14, APPR: 30, SHY: 30 };

const REG_FULL = {
  EU261: 'EU Regulation 261/2004 of the European Parliament and of the Council',
  UK261: 'UK Statutory Instrument 2019 No. 278 (UK261/2004)',
  APPR:  'Air Passenger Protection Regulations (SOR/2019-150)',
  SHY:   'Turkish Civil Aviation Law No. 2920, Article 143 and the SHY Passenger Regulation',
};

const AUTHORITY_NAMES = {
  EU261: 'the relevant National Enforcement Body (NEB) in the country of departure',
  UK261: 'the UK Civil Aviation Authority (CAA) at www.caa.co.uk',
  APPR:  'the Canadian Transportation Agency (CTA) at otc-cta.gc.ca/eng/air-travel-complaints',
  SHY:   'the Turkish Directorate General of Civil Aviation (SHGM) at web.shgm.gov.tr',
};

function currencySymbol(currency) {
  return currency === 'GBP' ? '£' : currency === 'CAD' ? 'CAD $' : '€';
}

function buildManagedLetterPrompt(claim) {
  const { regulation, passengerName, airline, flightNumber, flightDate,
          departureAirport, arrivalAirport, disruptionType, bookingReference,
          scheduledArrival, actualArrival, description, currency, estimatedCompensation } = claim;

  const deadlineDays = DEADLINE_DAYS[regulation] || 14;
  const regFull      = REG_FULL[regulation] || REG_FULL.EU261;
  const authority    = AUTHORITY_NAMES[regulation] || AUTHORITY_NAMES.EU261;

  const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const compLine = estimatedCompensation
    ? `COMPENSATION DEMANDED: ${currencySymbol(currency)}${estimatedCompensation} — state this exact figure`
    : `COMPENSATION DEMANDED: the full statutory amount under ${regulation} — do not invent a figure`;

  const timingLines = scheduledArrival && actualArrival
    ? `\nScheduled arrival: ${scheduledArrival}\nActual arrival: ${actualArrival}` : '';

  const regArticles = {
    EU261: 'Article 5 (cancellations), Article 6 (delays), and/or Article 7 (compensation amounts)',
    UK261: 'Article 5 (cancellations), Article 6 (delays), and/or Article 7 (compensation amounts)',
    APPR:  'Section 19 (compensation for controllable disruptions) and Section 10 (treatment standards)',
    SHY:   'Article 143 (compensation entitlement) of Turkish Civil Aviation Law No. 2920',
  }[regulation] || 'the relevant compensation articles';

  return `Write a formal compensation claim letter. This letter is written BY Noontide Ventures LLC (operating as FlightComp) as the authorised representative of their client ${passengerName}, acting under a signed assignment of rights.

SENDER (author of this letter):
Noontide Ventures LLC, operating as FlightComp
Email for all correspondence: support@getflightcomp.com

CLIENT / CLAIMANT:
${passengerName}
${claim.passengerAddress}
Authorization ID: ${claim.authorizationId}

FLIGHT DETAILS:
- Airline: ${airline}
- Flight number: ${flightNumber}
- Date: ${flightDate}
- Departure: ${departureAirport}
- Arrival: ${arrivalAirport}
- Disruption: ${disruptionType}${bookingReference ? `\n- Booking reference: ${bookingReference}` : ''}${timingLines}${description ? `\n- Passenger account: ${description}` : ''}

REGULATION: ${regFull}
${compLine}

LETTER REQUIREMENTS:
1. Date: ${today}
2. Address to: Customer Relations / Claims Department, ${airline}
3. Subject: Compensation Claim — ${passengerName} — Flight ${flightNumber} on ${flightDate} — ${regulation}
4. Open by identifying Noontide Ventures LLC as the duly authorised representative of ${passengerName}, holding a signed assignment of rights. State that ALL correspondence must be directed to support@getflightcomp.com — not to the passenger directly.
5. Describe the disruption factually and precisely
6. In one consolidated paragraph, cite ${regFull} — specifically ${regArticles} — and assert statutory entitlement
7. ${compLine}
8. ${bookingReference ? `Reference booking: ${bookingReference}` : 'Reference the flight number and date'}
9. Set a firm ${deadlineDays}-day response deadline: ${deadline}
10. State that failure to respond will result in escalation to ${authority}
11. Professional, firm, legally precise tone — equivalent to a solicitor's letter
12. Close: "Yours faithfully,\n\nNoontide Ventures LLC\noperating as FlightComp\non behalf of ${passengerName}"
13. Write the complete letter only — no preamble, commentary, or meta-text

Write the letter now:`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  let claim = getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status !== 'authorized') {
    return res.status(400).json({ error: `Cannot generate letter: claim is in status '${claim.status}'` });
  }

  let letter;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildManagedLetterPrompt(claim) }],
    });
    letter = message.content[0]?.text || '';
    if (!letter) throw new Error('Empty response from Claude');
  } catch (err) {
    console.error('[claims/generate-letter] Error:', err.message);
    return res.status(500).json({ error: 'Letter generation failed' });
  }

  const now = new Date().toISOString();
  claim = {
    ...claim,
    claimLetterText:        letter,
    claimLetterGeneratedAt: now,
    status: 'letter_generated',
    updatedAt: now,
  };
  claim = addEvent(claim, 'letter_generated', `Managed-service claim letter generated (${letter.length} chars).`);
  saveClaim(claim);

  return res.status(200).json({ ok: true, claim });
}
