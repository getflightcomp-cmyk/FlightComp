import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Disruption label helpers ──────────────────────────
const DISRUPTION_LABELS = {
  cancelled: 'cancellation',
  delayed: 'delay',
  denied: 'denied boarding',
  downgraded: 'downgrade',
};

const DELAY_LABELS = {
  under2: 'under 2 hours',
  '2to3': '2–3 hours',
  '3to4': '3–4 hours',
  '4plus': '4+ hours',
};

const REASON_LABELS = {
  technical: 'technical/mechanical fault',
  crew: 'crew/staffing issue',
  weather: 'severe weather (extraordinary circumstances)',
  none: 'no reason given by the airline',
  other: 'other (not specified)',
};

const APPR_DELAY_LABELS = {
  under3: 'under 3 hours',
  '3to6': '3–6 hours',
  '6to9': '6–9 hours',
  '9plus': '9+ hours',
};

const APPR_REASON_LABELS = {
  controlled:   'airline-controlled reason (technical issue, crew shortage, overbooking, or scheduling)',
  safety:       'safety-related reason',
  uncontrolled: 'reason outside airline control (weather, ATC, security incident)',
  unknown:      'no reason given by the airline',
};

const AIRLINE_SIZE_LABELS = {
  large:   'large carrier',
  small:   'small carrier',
  unknown: 'carrier (size unconfirmed)',
};

const SHY_REASON_LABELS = {
  airline:      'airline-controlled reason (technical issue, crew shortage, overbooking, or operational problem)',
  forcemajeure: 'force majeure (severe weather, political instability, natural disaster, airport strike, security risk)',
  unknown:      'no reason given by the airline',
};

// ── SHY (Turkey) prompt ───────────────────────────────
function buildSHYPrompt({ answers, result, details }) {
  const {
    flightNumber, flightDate, from, to, disruption, delayLength, shyReason, shyNotified14,
  } = answers;

  const {
    verdict, compensation, verdictNote, distanceKm, depInfo, arrInfo, isDomestic,
  } = result;

  const { name, email, address, bookingRef, bankDetails } = details;

  const compAmt    = compensation?.amount || 'the applicable statutory amount';
  const distStr    = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity    = depInfo ? `${depInfo.city} (${from.toUpperCase()})` : from;
  const arrCity    = arrInfo ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel = disruption === 'delayed' ? ` of ${DELAY_LABELS[delayLength] || delayLength}` : '';
  const reasonLabel = SHY_REASON_LABELS[shyReason] || shyReason;
  const routeType  = isDomestic ? 'domestic (Turkey internal)' : 'international';

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `You are a specialist aviation law letter writer familiar with Turkish passenger rights. Write a formal, professional claim letter on behalf of the passenger under Turkey's SHY Passenger Regulation (Sivil Havacılık Yönetmeliği), established under Turkish Civil Aviation Law No. 2920, Article 143.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Flight date: ${flightDate || 'Unknown'}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Route type: ${routeType}
- Disruption type: ${disruptionLabel}${delayLabel}
- Reason given by airline: ${reasonLabel}
${shyNotified14 === 'yes' ? '- Passenger was notified 14+ days in advance (noted for context)' : ''}
- Applicable regulation: SHY Passenger Regulation (Sivil Havacılık Yönetmeliği), Turkish Civil Aviation Law No. 2920, Article 143
- Compensation amount: ${compAmt}

ELIGIBILITY VERDICT: ${verdict.toUpperCase()}
${verdictNote ? `Note: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date the letter ${today}
2. Address it formally to: Customer Relations Department, [Airline Name]
3. Use the flight number as the subject reference
4. Open with a clear statement of the claim under the SHY Passenger Regulation (Sivil Havacılık Yönetmeliği)
5. Cite Turkish Civil Aviation Law No. 2920, Article 143 as the legal basis
6. State the compensation amount: ${compAmt} — note that it is denominated in EUR but payable in Turkish Lira at the Central Bank of the Republic of Turkey (TCMB) exchange rate on the date of ticket purchase
7. Reference the booking reference and flight date
8. Set a 30-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the Turkish Directorate General of Civil Aviation (Sivil Havacılık Genel Müdürlüğü — SHGM) at https://web.shgm.gov.tr
10. Close with a formal sign-off
11. Keep the tone firm but professional — not aggressive
12. Write the full letter only, no commentary or preamble
13. Format it as a real business letter with proper spacing between sections
${bankDetails ? '14. Include a polite request that compensation be paid to the bank details provided' : ''}

Write the complete letter now:`;
}

// ── APPR prompt ───────────────────────────────────────
function buildAPPRPrompt({ answers, result, details }) {
  const {
    flightNumber, flightDate, from, to, disruption,
    apprDelayTier, airlineSize, apprReason,
  } = answers;

  const {
    verdict, compensation, verdictNote, distanceKm, depInfo, arrInfo,
  } = result;

  const { name, email, address, bookingRef, bankDetails } = details;

  const compAmt    = compensation?.amount || 'the applicable statutory amount';
  const distStr    = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity    = depInfo ? `${depInfo.city} (${from.toUpperCase()})` : from;
  const arrCity    = arrInfo ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel = disruption === 'delayed' ? ` of ${APPR_DELAY_LABELS[apprDelayTier] || apprDelayTier}` : '';
  const reasonLabel = APPR_REASON_LABELS[apprReason] || apprReason;
  const sizeLabel  = AIRLINE_SIZE_LABELS[airlineSize] || 'carrier';

  const today = new Date().toLocaleDateString('en-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `You are a specialist aviation law letter writer familiar with Canadian passenger rights. Write a formal, professional claim letter on behalf of the passenger under Canada's Air Passenger Protection Regulations (APPR), SOR/2019-150.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Flight date: ${flightDate || 'Unknown'}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Disruption type: ${disruptionLabel}${delayLabel}
- Reason given by airline: ${reasonLabel}
- Airline type: ${sizeLabel}
- Applicable regulation: Air Passenger Protection Regulations (SOR/2019-150)
- Compensation amount: ${compAmt} per passenger

ELIGIBILITY VERDICT: ${verdict.toUpperCase()}
${verdictNote ? `Note: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date the letter ${today}
2. Address it formally to: Customer Relations Department, [Airline Name]
3. Use the flight number as the subject reference
4. Open with a clear statement of the claim under the Air Passenger Protection Regulations (SOR/2019-150)
5. Cite the specific regulatory sections:
   - Section 19 (compensation for flight delays and cancellations within airline's control)
   - Section 10 (standards for treatment of passengers)
   - Section 17 (denied boarding compensation)
   (cite only the sections relevant to the disruption type)
6. State the specific compensation amount: ${compAmt} per passenger
7. Reference the booking reference and flight date
8. Set a 30-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the Canadian Transportation Agency (CTA) at https://otc-cta.gc.ca/eng/air-travel-complaints
10. Close with a formal sign-off
11. Keep the tone firm but professional — not aggressive
12. Write the full letter only, no commentary or preamble
13. Format it as a real business letter with proper spacing between sections
${bankDetails ? '14. Include a polite request that compensation be paid to the bank details provided' : ''}

Write the complete letter now:`;
}

// ── EU261/UK261 prompt ────────────────────────────────
function buildPrompt({ answers, result, details }) {
  const {
    flightNumber, flightDate, from, to, disruption, delayLength, reason,
  } = answers;

  const {
    verdict, regulation, compensation, verdictNote, distanceKm, depInfo, arrInfo,
  } = result;

  const {
    name, email, address, bookingRef, bankDetails,
  } = details;

  const regFull  = regulation === 'UK261'
    ? 'UK Statutory Instrument 2019 No. 278 (UK261/2004)'
    : 'EU Regulation 261/2004 of the European Parliament and of the Council';
  const compAmt  = compensation?.amount || 'the applicable statutory amount';
  const distStr  = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity  = depInfo  ? `${depInfo.city}  (${from.toUpperCase()})` : from;
  const arrCity  = arrInfo  ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel      = disruption === 'delayed' ? ` of ${DELAY_LABELS[delayLength] || delayLength}` : '';
  const reasonLabel     = REASON_LABELS[reason] || reason;

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return `You are a specialist aviation law letter writer. Write a formal, professional claim letter on behalf of the passenger.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Flight date: ${flightDate || 'Unknown'}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Disruption type: ${disruptionLabel}${delayLabel}
- Reason given by airline: ${reasonLabel}
- Applicable regulation: ${regFull}
- Compensation tier: ${compAmt} per passenger

ELIGIBILITY VERDICT: ${verdict.toUpperCase()}
${verdictNote ? `Note: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date the letter ${today}
2. Address it formally to: Customer Relations Department, [Airline Name]
3. Use the flight number as the subject reference
4. Open with a clear statement of the claim under ${regulation === 'UK261' ? 'UK261' : 'EU261'}
5. Cite the specific article numbers: Article 5 (cancellations), Article 6 (delay), Article 7 (compensation), Article 8 (reimbursement/re-routing), Article 9 (care)
6. State the specific compensation amount: ${compAmt}
7. Reference the booking reference and flight date
8. Set a 14-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the relevant National Enforcement Body
10. Close with a formal sign-off
11. Keep the tone firm but professional — not aggressive
12. Write the full letter only, no commentary or preamble
13. Format it as a real business letter with proper spacing between sections
${bankDetails ? '14. Include a polite request that compensation be paid to the bank details provided' : ''}

Write the complete letter now:`;
}

// ── Handler ───────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answers, result, details } = req.body;

  if (!answers || !result || !details) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!details.name?.trim() || !details.email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  let prompt;
  if (result.regulation === 'APPR') {
    prompt = buildAPPRPrompt({ answers, result, details });
  } else if (result.regulation === 'SHY') {
    prompt = buildSHYPrompt({ answers, result, details });
  } else {
    prompt = buildPrompt({ answers, result, details });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const letter = message.content[0]?.text || '';

    if (!letter) {
      throw new Error('Empty response from Claude');
    }

    return res.status(200).json({ letter });
  } catch (err) {
    console.error('[generate-letter] Error:', err.message);
    return res.status(500).json({ error: 'Letter generation failed. Please try again.' });
  }
}
