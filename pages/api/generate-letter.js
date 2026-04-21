import Anthropic from '@anthropic-ai/sdk';
import { selectTemplate, buildTemplateParams } from '../../lib/letterTemplates';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Label helpers ──────────────────────────────────────
const DISRUPTION_LABELS = {
  cancelled:  'cancellation',
  delayed:    'delay',
  denied:     'denied boarding',
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
  crew:      'crew/staffing issue',
  weather:   'severe weather (extraordinary circumstances)',
  none:      'no reason given by the airline',
  other:     'other (not specified)',
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

// ── Language helpers ───────────────────────────────────
const LANGUAGE_NAMES = {
  en: 'English',
  tr: 'Turkish (Türkçe)',
  fr: 'French (Canadian French — français canadien)',
  de: 'German (Deutsch)',
  es: 'Spanish (Español — neutral international register)',
};

function languageDirective(lang) {
  if (lang === 'en' || !lang) return '';
  const name = LANGUAGE_NAMES[lang] || 'English';
  return `CRITICAL LANGUAGE REQUIREMENT:
Write the ENTIRE letter body in ${name}. Every single sentence, legal citation commentary, and transition phrase must be in ${name}.

Specifically:
- All legal analysis and argumentation: in ${name}
- The regulation NAMES themselves (EU Regulation 261/2004, UK261, APPR SOR/2019-150, SHY) remain untranslated as proper nouns
- The regulation article numbers (e.g., Article 5(1)(c), Article 7) remain in their formal form
- Airline name remains as-is
- Amount + currency remains as-is (€600, £220, CA$900)
- The passenger's name remains as-is (do not transliterate)

If you find yourself about to write an English phrase, STOP and write it in ${name} instead. No English anywhere except proper nouns and regulation names.

DATE HANDLING: All dates embedded in this prompt are already formatted in ${name} locale. Copy them verbatim into the letter exactly as provided. Do NOT re-format dates in English. Do NOT translate month names — the dates are already in the correct language.

`;
}

const LOCALE_FOR_DATES = {
  en: 'en-GB',
  tr: 'tr-TR',
  fr: 'fr-CA',
  de: 'de-DE',
  es: 'es-ES',
};

function getDateLocale(lang, fallback = 'en-GB') {
  return LOCALE_FOR_DATES[lang] || fallback;
}

function formatFlightDate(isoDate, locale) {
  if (!isoDate) return 'Unknown';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate; // fall back to raw string if invalid
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Delay duration calculator ──────────────────────────
function calcDelay(scheduledTime, actualTime) {
  if (!scheduledTime || !actualTime) return null;
  const [sh, sm] = scheduledTime.split(':').map(Number);
  const [ah, am] = actualTime.split(':').map(Number);
  let mins = (ah * 60 + am) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // spans midnight
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0
    ? (m > 0 ? `${h} hours and ${m} minutes` : `${h} hour${h !== 1 ? 's' : ''}`)
    : `${m} minutes`;
  return { mins, label };
}

// ── Shared timing section for prompts ─────────────────
function buildTimingBlock(flightDetails = {}, disruption, arrCity, flightNumber, flightDate, dateLocale) {
  const { scheduledTime, actualTime, incidentDescription } = flightDetails;
  const delay = calcDelay(scheduledTime, actualTime);
  const lines = [];

  if (scheduledTime && actualTime && delay && disruption === 'delayed') {
    lines.push(`EXACT FLIGHT TIMING (include all of these facts in the letter, written in the target language):`);
    lines.push(`- Scheduled arrival at ${arrCity}: ${scheduledTime}`);
    lines.push(`- Actual arrival: ${actualTime}`);
    lines.push(`- Calculated delay: ${delay.mins} minutes (approximately ${delay.label} — render this in the target language's natural phrasing)`);
    lines.push(`- Flight: ${flightNumber || '[flight number]'}`);
    if (flightDate) {
      const flightDateFmt = formatFlightDate(flightDate, dateLocale);
      lines.push(`- Flight date: ${flightDateFmt}`);
    }
  } else if (scheduledTime && actualTime) {
    lines.push(`TIMING:`);
    lines.push(`- Scheduled: ${scheduledTime}`);
    lines.push(`- Actual: ${actualTime}`);
  }

  if (incidentDescription) {
    lines.push(`PASSENGER'S ACCOUNT (incorporate naturally, translated into the target language as needed):`);
    lines.push(`"${incidentDescription}"`);
  }

  return lines.length ? lines.join('\n') : '';
}

// ── EU261 / UK261 prompt ──────────────────────────────
function buildPrompt({ answers, result, details, flightDetails, language = 'en' }) {
  const {
    flightNumber, flightDate, from, to, disruption, delayLength, reason,
  } = answers;

  const {
    verdict, regulation, compensation, verdictNote, distanceKm, depInfo, arrInfo,
  } = result;

  const { name, email, address, bookingRef, bankDetails } = details;

  const regFull  = regulation === 'UK261'
    ? 'UK Statutory Instrument 2019 No. 278 (UK261/2004)'
    : 'EU Regulation 261/2004 of the European Parliament and of the Council';
  const compAmt  = compensation?.amount || null;
  const compLine = compAmt
    ? `EXACT COMPENSATION AMOUNT: ${compAmt} — use this exact figure. Do NOT write a range (e.g. do not write "€250–€600"). State "${compAmt}" specifically.`
    : 'COMPENSATION AMOUNT: the applicable statutory amount (distance not determinable — do not invent a figure)';
  const distStr  = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity  = depInfo  ? `${depInfo.city} (${from.toUpperCase()})` : from;
  const arrCity  = arrInfo  ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel      = disruption === 'delayed' ? ` of ${DELAY_LABELS[delayLength] || delayLength}` : '';
  const reasonLabel     = REASON_LABELS[reason] || reason;

  const dateLocale = getDateLocale(language, 'en-GB');
  const flightDateFmt = formatFlightDate(flightDate, dateLocale);
  const today    = new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });

  const timingBlock = buildTimingBlock(flightDetails, disruption, arrCity, flightNumber, flightDate, dateLocale);

  return `${languageDirective(language)}Write a formal compensation claim letter on behalf of a passenger. The letter should read as if the passenger wrote it personally — do not reference any claim tool, service, or third party.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Bank/payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Date of travel: ${flightDateFmt}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Disruption: ${disruptionLabel}${delayLabel}
- Reason given: ${reasonLabel}
- Regulation: ${regFull}

${compLine}

DATA SANITY CHECK:
Before writing the letter, internally verify the compensation amount matches the distance under the stated regulation:
- EU261 / UK261 Article 7: €250 for ≤1500 km; €400 for 1500–3500 km; €600 for >3500 km
If the stated compensation amount appears INCONSISTENT with the stated distance and regulation (e.g., claiming €600 for a 345 km flight), do NOT demand the higher figure. Instead, state only the correct legally owed amount per the tiered schedule, and do not cite or reference the inconsistent amount. Your primary duty is to write a legally sound letter — overstating the claim would cause the airline to reject it outright.

${timingBlock}

VERDICT: ${verdict.toUpperCase()}${verdictNote ? `\nContext: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date: ${today}
2. Address to: Customer Relations Department, [Airline Name]
3. Do NOT include a subject line, date line, or recipient address block at the top of the letter. Those are drawn by the PDF scaffolding. Start the letter body directly with the opening paragraph.
4. Open with a factual statement of the disruption including exact times if provided above
5. In one consolidated paragraph, cite the legal basis: ${regulation === 'UK261' ? 'UK Statutory Instrument 2019 No. 278' : 'EU Regulation 261/2004'} — specifically Article 5 (cancellations), Article 6 (delay), or Article 7 (compensation amounts) as relevant to this case
6. ${compLine}
7. Include booking reference if provided
8. Set a firm 14-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the ${regulation === 'UK261' ? 'Civil Aviation Authority (CAA)' : 'relevant National Enforcement Body (NEB)'}
10. Do NOT include a closing (no "Sincerely," no "Yours faithfully," no signature line, no sender name, no sender email, no sender address). The PDF scaffolding will add the closing automatically. End the letter with the final content paragraph about escalation. The letter body must NOT contain any sign-off whatsoever.
11. Write the complete letter body only — no preamble, commentary, or instructions
12. Professional and direct tone — firm but not aggressive
13. The letter must read as if the passenger wrote it directly
${bankDetails ? '14. Include payment instructions using the bank/payment details above' : ''}

Write the letter now:`;
}

// ── APPR prompt ────────────────────────────────────────
function buildAPPRPrompt({ answers, result, details, flightDetails, language = 'en' }) {
  const {
    flightNumber, flightDate, from, to, disruption,
    apprDelayTier, airlineSize, apprReason,
  } = answers;

  const {
    verdict, compensation, verdictNote, distanceKm, depInfo, arrInfo,
  } = result;

  const { name, email, address, bookingRef, bankDetails } = details;

  const compAmt    = compensation?.amount || null;
  const compLineAPPR = compAmt
    ? `EXACT COMPENSATION AMOUNT: ${compAmt} per passenger — use this exact figure. Do NOT write a range.`
    : 'COMPENSATION AMOUNT: the applicable statutory amount (do not invent a figure)';
  const distStr    = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity    = depInfo ? `${depInfo.city} (${from.toUpperCase()})` : from;
  const arrCity    = arrInfo ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel = disruption === 'delayed' ? ` of ${APPR_DELAY_LABELS[apprDelayTier] || apprDelayTier}` : '';
  const reasonLabel = APPR_REASON_LABELS[apprReason] || apprReason;
  const sizeLabel  = AIRLINE_SIZE_LABELS[airlineSize] || 'carrier';

  const dateLocale = getDateLocale(language, 'en-CA');
  const flightDateFmt = formatFlightDate(flightDate, dateLocale);
  const today    = new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });

  const timingBlock = buildTimingBlock(flightDetails, disruption, arrCity, flightNumber, flightDate, dateLocale);

  return `${languageDirective(language)}Write a formal compensation claim letter on behalf of a passenger under Canada's Air Passenger Protection Regulations. The letter should read as if the passenger wrote it personally — do not reference any claim tool, service, or third party.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Bank/payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Date of travel: ${flightDateFmt}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Disruption: ${disruptionLabel}${delayLabel}
- Reason given: ${reasonLabel}
- Airline size: ${sizeLabel}
- Regulation: Air Passenger Protection Regulations (SOR/2019-150)

${compLineAPPR}

DATA SANITY CHECK:
Before writing the letter, internally verify the compensation amount matches the disruption tier under the stated regulation:
- APPR Section 19 (large carrier): CA$400 (3–6h delay or cancellation); CA$700 (6–9h); CA$1000 (9h+); CA$900 (denied boarding, large carrier)
- APPR Section 19 (small carrier): CA$125 / CA$250 / CA$500 for equivalent tiers
If the stated compensation amount appears INCONSISTENT with the stated disruption tier and airline size, do NOT demand the higher figure. Instead, state only the correct legally owed amount per the tiered schedule, and do not cite or reference the inconsistent amount. Your primary duty is to write a legally sound letter — overstating the claim would cause the airline to reject it outright.

${timingBlock}

VERDICT: ${verdict.toUpperCase()}${verdictNote ? `\nContext: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date: ${today}
2. Address to: Customer Relations Department, [Airline Name]
3. Do NOT include a subject line, date line, or recipient address block at the top of the letter. Those are drawn by the PDF scaffolding. Start the letter body directly with the opening paragraph.
4. Open with a factual statement of the disruption including exact times if provided above
5. In one consolidated paragraph, cite the legal basis: Air Passenger Protection Regulations (SOR/2019-150) — specifically Section 19 (compensation for delays/cancellations within airline control), Section 10 (treatment standards), or Section 17 (denied boarding) as relevant to this case
6. ${compLineAPPR}
7. Include booking reference if provided
8. Set a 30-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the Canadian Transportation Agency (CTA) at https://otc-cta.gc.ca/eng/air-travel-complaints
10. Do NOT include a closing (no "Sincerely," no "Yours faithfully," no signature line, no sender name, no sender email, no sender address). The PDF scaffolding will add the closing automatically. End the letter with the final content paragraph about escalation. The letter body must NOT contain any sign-off whatsoever.
11. Write the complete letter body only — no preamble, commentary, or instructions
12. Professional and direct tone — firm but not aggressive
13. The letter must read as if the passenger wrote it directly
${bankDetails ? '14. Include payment instructions using the bank/payment details above' : ''}

Write the letter now:`;
}

// ── SHY (Turkey) prompt ────────────────────────────────
function buildSHYPrompt({ answers, result, details, flightDetails, language = 'en' }) {
  const {
    flightNumber, flightDate, from, to, disruption, delayLength, shyReason, shyNotified14,
  } = answers;

  const {
    verdict, compensation, verdictNote, distanceKm, depInfo, arrInfo, isDomestic,
  } = result;

  const { name, email, address, bookingRef, bankDetails } = details;

  const compAmt    = compensation?.amount || null;
  const compLineSHY = compAmt
    ? `EXACT COMPENSATION AMOUNT: ${compAmt} (denominated in EUR, payable in Turkish Lira at TCMB rate on ticket purchase date) — use this exact figure. Do NOT write a range.`
    : 'COMPENSATION AMOUNT: the applicable statutory amount (do not invent a figure)';
  const distStr    = distanceKm ? `${distanceKm.toLocaleString()} km` : 'unknown distance';
  const depCity    = depInfo ? `${depInfo.city} (${from.toUpperCase()})` : from;
  const arrCity    = arrInfo ? `${arrInfo.city} (${to.toUpperCase()})` : to;
  const disruptionLabel = DISRUPTION_LABELS[disruption] || disruption;
  const delayLabel = disruption === 'delayed' ? ` of ${DELAY_LABELS[delayLength] || delayLength}` : '';
  const reasonLabel = SHY_REASON_LABELS[shyReason] || shyReason;
  const routeType  = isDomestic ? 'domestic (Turkey internal)' : 'international';

  const dateLocale = getDateLocale(language, 'en-GB');
  const flightDateFmt = formatFlightDate(flightDate, dateLocale);
  const today    = new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });

  const timingBlock = buildTimingBlock(flightDetails, disruption, arrCity, flightNumber, flightDate, dateLocale);

  return `${languageDirective(language)}Write a formal compensation claim letter on behalf of a passenger under Turkey's SHY Passenger Regulation. The letter should read as if the passenger wrote it personally — do not reference any claim tool, service, or third party.

PASSENGER DETAILS:
- Full name: ${name}
- Address: ${address}
- Email: ${email}
${bookingRef ? `- Booking reference: ${bookingRef}` : ''}
${bankDetails ? `- Bank/payment details: ${bankDetails}` : ''}

FLIGHT DETAILS:
- Flight number: ${flightNumber || 'Unknown'}
- Date of travel: ${flightDateFmt}
- Departure: ${depCity}
- Destination: ${arrCity}
- Route distance: ${distStr}
- Route type: ${routeType}
- Disruption: ${disruptionLabel}${delayLabel}
- Reason given: ${reasonLabel}
${shyNotified14 === 'yes' ? '- Note: passenger was notified 14+ days in advance' : ''}
- Regulation: SHY Passenger Regulation (Sivil Havacilık Yonetmeligi), Turkish Civil Aviation Law No. 2920, Article 143

${compLineSHY}

DATA SANITY CHECK:
Before writing the letter, internally verify the compensation amount matches the distance under the SHY Passenger Regulation (mirrors EU261 Article 7 tiers, denominated in EUR):
- €250 for ≤1500 km; €400 for 1500–3500 km; €600 for >3500 km
If the stated compensation amount appears INCONSISTENT with the stated distance, do NOT demand the higher figure. Instead, state only the correct legally owed amount per the tiered schedule, and do not cite or reference the inconsistent amount. Your primary duty is to write a legally sound letter — overstating the claim would cause the airline to reject it outright.

${timingBlock}

VERDICT: ${verdict.toUpperCase()}${verdictNote ? `\nContext: ${verdictNote}` : ''}

LETTER REQUIREMENTS:
1. Date: ${today}
2. Address to: Customer Relations Department, [Airline Name]
3. Do NOT include a subject line, date line, or recipient address block at the top of the letter. Those are drawn by the PDF scaffolding. Start the letter body directly with the opening paragraph.
4. Open with a factual statement of the disruption including exact times if provided above
5. In one consolidated paragraph, cite the legal basis: Turkish Civil Aviation Law No. 2920, Article 143 and the SHY Passenger Regulation; state that compensation is denominated in EUR but payable in Turkish Lira at the Central Bank of Turkey (TCMB) exchange rate on the date of ticket purchase
6. ${compLineSHY}
7. Include booking reference if provided
8. Set a 30-day response deadline: ${deadline}
9. State that failure to respond will result in escalation to the Turkish Directorate General of Civil Aviation (SHGM — Sivil Havacılık Genel Müdürlüğü) at https://web.shgm.gov.tr
10. Do NOT include a closing (no "Sincerely," no "Yours faithfully," no signature line, no sender name, no sender email, no sender address). The PDF scaffolding will add the closing automatically. End the letter with the final content paragraph about escalation. The letter body must NOT contain any sign-off whatsoever.
11. Write the complete letter body only — no preamble, commentary, or instructions
12. Professional and direct tone — firm but not aggressive
13. The letter must read as if the passenger wrote it directly
${bankDetails ? '14. Include payment instructions using the bank/payment details above' : ''}

Write the letter now:`;
}

// ── Handler ────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answers, result, details, flightDetails, language } = req.body;
  const lang = ['en', 'tr', 'fr', 'de', 'es'].includes((language || '').toLowerCase())
    ? language.toLowerCase()
    : 'en';

  if (!answers || !result || !details) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!details.name?.trim() || !details.email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // ── Try cached template first (English only — templates are English-only) ──
  const regulation = result.regulation || 'EU261';
  const disruption = answers.disruption || '';
  const reason     = answers.reason || answers.apprReason || answers.shyReason || 'none';

  if (lang === 'en') {
    const templateFn = selectTemplate({ regulation, disruption, reason });
    if (templateFn) {
      try {
        const params = buildTemplateParams({ answers, result, details, flightDetails: flightDetails || {} });
        const letter = templateFn(params);
        return res.status(200).json({ letter, source: 'template' });
      } catch (err) {
        console.warn('[generate-letter] Template render failed, falling back to Claude:', err.message);
      }
    }
  }

  // ── Claude API (always used for non-English; fallback for English) ──
  let prompt;
  if (regulation === 'APPR') {
    prompt = buildAPPRPrompt({ answers, result, details, flightDetails: flightDetails || {}, language: lang });
  } else if (regulation === 'SHY') {
    prompt = buildSHYPrompt({ answers, result, details, flightDetails: flightDetails || {}, language: lang });
  } else {
    prompt = buildPrompt({ answers, result, details, flightDetails: flightDetails || {}, language: lang });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const letter = message.content[0]?.text || '';
    if (!letter) throw new Error('Empty response from Claude');

    return res.status(200).json({ letter, source: 'claude' });
  } catch (err) {
    console.error('[generate-letter] Error:', err.message);
    return res.status(500).json({ error: 'Letter generation failed. Please try again.' });
  }
}
