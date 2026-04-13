/**
 * Letter templates for the DIY Claims Kit PDF generator.
 * Each template is a function that receives passenger/flight params
 * and returns a complete formal letter string.
 *
 * Managed service letters (pages/api/claims/[id]/generate-letter.js)
 * always use the Claude API directly — templates are not used there.
 *
 * Template key format: REGULATION_DISRUPTION_REASON
 * e.g. EU261_cancelled_technical, UK261_delayed_none, APPR_controlled
 *
 * Matching order (in selectTemplate):
 *  1. Exact key   — EU261_cancelled_technical
 *  2. Broad key   — EU261_cancelled (any reason)
 *  3. null        — caller falls back to Claude API
 */

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────
function bookingLine(bookingRef) {
  return bookingRef ? `\nBooking reference: ${bookingRef}` : '';
}

function closingBlock(name, email, todayDate) {
  return `Yours faithfully,\n\n${name}\n${email}\n${todayDate}`;
}

// ─────────────────────────────────────────────
// EU Regulation 261/2004 templates
// ─────────────────────────────────────────────

function eu261_cancelled_technical(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of flight ${p.flightNumber}, scheduled to operate from ${p.depCity} to ${p.arrCity} on ${p.flightDate}. The flight was cancelled without the required minimum notice, causing me significant inconvenience and loss.

Under Article 5(1)(c) and Article 7(1) of EU Regulation 261/2004, passengers whose flight is cancelled with fewer than 14 days' notice are entitled to fixed compensation of ${p.compAmount || 'the applicable statutory amount'}. The reported cause — a technical or mechanical fault with the aircraft — does not constitute an extraordinary circumstance within the meaning of Recital 14 of the Regulation. The Court of Justice of the European Union confirmed in Wallentin-Hermann v Alitalia (Case C-549/07) that a technical problem is an inherent part of normal airline operations and does not exempt the carrier from its compensation obligations unless the defect arises from a concealed manufacturing fault entirely outside the airline's control. No such exceptional circumstances apply here.

I was not informed of the cancellation at least 14 days prior to the scheduled departure, and no alternative transport was offered within the windows prescribed by Article 5(1)(c).

I therefore request payment of ${p.compAmount || 'the applicable compensation'} per passenger within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a claim reference for my records.

If I do not receive a satisfactory response within that time, I will escalate this matter to the relevant National Enforcement Body (NEB) without further notice.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_cancelled_weather(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of the cancellation of flight ${p.flightNumber}, scheduled to depart from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Article 5(1)(c) and Article 7(1) of EU Regulation 261/2004, passengers whose flight is cancelled without at least 14 days' advance notice are entitled to compensation of ${p.compAmount || 'the applicable statutory amount'}. While I note the airline may assert that weather conditions constituted extraordinary circumstances under Article 5(3), the airline bears the burden of proving that those circumstances were (a) extraordinary, (b) could not have been avoided even if all reasonable measures had been taken, and (c) directly caused the cancellation, as confirmed by the CJEU in Van der Lans v KLM (Case C-257/14). General references to adverse weather do not satisfy this threshold without specific evidence and operational data.

I was given less than 14 days' notice of the cancellation and was not offered an alternative flight within the timeframes specified in Article 5(1)(c)(ii) or (iii).

I request payment of ${p.compAmount || 'the applicable compensation'} per passenger within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please provide written confirmation of receipt and a claim reference number.

Should I not receive a satisfactory response by that date, I will refer this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_cancelled_none(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of the cancellation of flight ${p.flightNumber}, which was scheduled to depart from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Article 5(1)(c) and Article 7(1) of EU Regulation 261/2004, I am entitled to fixed compensation of ${p.compAmount || 'the applicable statutory amount'} where a flight is cancelled and passengers are not informed at least 14 days in advance. No reason for the cancellation was communicated to me. The airline has not demonstrated that the cancellation was caused by extraordinary circumstances which could not have been avoided even if all reasonable measures had been taken, as required by Article 5(3). The burden of proving extraordinary circumstances rests with the carrier.

I was not offered alternative transport within the timeframes required under Article 5(1)(c) and received no satisfactory explanation for the cancellation.

I therefore request payment of ${p.compAmount || 'the applicable compensation'} within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a claim reference number.

If I receive no satisfactory response by that date, I will escalate this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_delayed_technical(p) {
  const timingLine = (p.scheduledArrival && p.actualArrival && p.delayLabel)
    ? `\nFlight ${p.flightNumber} was scheduled to arrive at ${p.arrCity} on ${p.flightDate} at ${p.scheduledArrival}. It arrived at ${p.actualArrival}, a delay of ${p.delayLabel}.\n`
    : '';

  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Delay Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of the significant delay to flight ${p.flightNumber}, operated from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.
${timingLine}
Under Article 7 of EU Regulation 261/2004, as confirmed by the Court of Justice of the European Union in Sturgeon and Others v Condor and Böck and Others v Air France (Joined Cases C-402/07 and C-432/07), passengers who arrive at their final destination three or more hours later than the scheduled arrival time are entitled to fixed compensation equivalent to that payable in cancellation cases. My arrival was delayed by more than three hours.

The reported cause — a technical or mechanical fault — does not constitute an extraordinary circumstance exempting the carrier from compensation under Article 5(3). The CJEU confirmed in Wallentin-Hermann v Alitalia (Case C-549/07) that technical problems inherent in normal airline operations do not qualify as extraordinary circumstances.

I am entitled to compensation of ${p.compAmount || 'the applicable statutory amount'} and request payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}).

Please confirm receipt and provide a claim reference number. If I receive no satisfactory response by that date, I will escalate this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_delayed_weather(p) {
  const timingLine = (p.scheduledArrival && p.actualArrival && p.delayLabel)
    ? `\nFlight ${p.flightNumber} was scheduled to arrive at ${p.arrCity} on ${p.flightDate} at ${p.scheduledArrival}. It arrived at ${p.actualArrival}, a delay of ${p.delayLabel}.\n`
    : '';

  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Delay Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of the significant arrival delay affecting flight ${p.flightNumber} from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.
${timingLine}
The CJEU confirmed in Sturgeon and Others v Condor (Joined Cases C-402/07 and C-432/07) that passengers delayed by three hours or more at their final destination are entitled to compensation equivalent to that provided for cancellations under Article 7. My delay exceeded three hours.

I note that the airline may rely on the extraordinary circumstances defence under Article 5(3). However, the airline bears the burden of demonstrating that (a) extraordinary circumstances existed, (b) they could not have been avoided by all reasonable measures, and (c) they directly caused the delay, as confirmed by the CJEU in Van der Lans v KLM (Case C-257/14). Generalised references to weather or air traffic control do not satisfy this burden without specific operational evidence.

I request payment of ${p.compAmount || 'the applicable statutory amount'} within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a reference number.

If I do not receive a satisfactory response, I will escalate this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_delayed_none(p) {
  const timingLine = (p.scheduledArrival && p.actualArrival && p.delayLabel)
    ? `\nFlight ${p.flightNumber} was scheduled to arrive at ${p.arrCity} at ${p.scheduledArrival} on ${p.flightDate}. It arrived at ${p.actualArrival}, representing a delay of ${p.delayLabel}.\n`
    : '';

  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Delay Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of the delay to flight ${p.flightNumber}, operated from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.
${timingLine}
In accordance with the ruling of the Court of Justice of the European Union in Sturgeon and Others v Condor and Böck and Others v Air France (Joined Cases C-402/07 and C-432/07), passengers who arrive at their final destination three or more hours late are entitled to fixed compensation under Article 7 of the Regulation. My flight arrived more than three hours behind schedule.

No explanation for the delay was provided. The carrier has not established extraordinary circumstances within the meaning of Article 5(3), nor demonstrated that all reasonable measures were taken to avoid the delay. The burden of proving extraordinary circumstances rests with the operating carrier.

I am entitled to compensation of ${p.compAmount || 'the applicable statutory amount'} and request payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and issue a claim reference number.

Should no satisfactory response be received by that date, I will escalate to the relevant National Enforcement Body without further notice.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_denied(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Denied Boarding Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under EU Regulation 261/2004 in respect of being denied boarding on flight ${p.flightNumber}, scheduled to depart from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Article 4 of EU Regulation 261/2004, where an operating air carrier reasonably expects to deny boarding on a flight, it must call for volunteers to surrender their reservations in exchange for benefits. Only after insufficient volunteers have been found may the carrier deny boarding against a passenger's will. Where boarding is denied involuntarily, Article 4(3) requires the carrier to immediately compensate affected passengers in accordance with Article 7.

I held a confirmed reservation, presented myself at the gate on time, and was denied boarding involuntarily. I am therefore entitled to fixed compensation of ${p.compAmount || 'the applicable statutory amount'} under Article 7(1), together with the rights to care and assistance under Article 9.

I request payment of ${p.compAmount || 'the applicable compensation'} within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a claim reference number.

If I do not receive a satisfactory response by that date, I will refer this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function eu261_downgrade(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Downgrade Compensation Claim under EU Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory reimbursement under EU Regulation 261/2004 in respect of being involuntarily downgraded from the class in which I booked on flight ${p.flightNumber}, operated from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Article 10(2) of EU Regulation 261/2004, where an operating air carrier places a passenger in a class lower than that for which the ticket was purchased, it must reimburse the passenger within seven days a percentage of the price of the ticket paid for the seat occupied, as follows: 30% for all flights of 1,500 km or less; 50% for all intra-Community flights of more than 1,500 km and all other flights between 1,500 and 3,500 km; and 75% for all flights not falling under the above. The applicable reimbursement percentage applies to the full fare paid including taxes and charges attributable to the downgraded seat.

I did not consent to the downgrade and was not offered any adequate alternative in the class booked. I request confirmation of the reimbursement owed and payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}).

If I do not receive a satisfactory response, I will escalate this matter to the relevant National Enforcement Body.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

// ─────────────────────────────────────────────
// UK261 templates (UK Statutory Instrument 2019 No. 278)
// ─────────────────────────────────────────────

function uk261_cancelled(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under UK Retained Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under the United Kingdom's retained version of EU Regulation 261/2004 (UK Statutory Instrument 2019 No. 278) in respect of the cancellation of flight ${p.flightNumber}, scheduled to operate from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Articles 5 and 7 of the retained UK Regulation, passengers whose flight is cancelled without at least 14 days' advance notice are entitled to fixed compensation of ${p.compAmount || 'the applicable statutory amount'}. The United Kingdom retained the substance of EU Regulation 261/2004 following Brexit, and the rights, obligations, and enforcement mechanisms applicable under the retained Regulation are materially equivalent to those under the original EU instrument.

I was not informed of the cancellation at least 14 days before the scheduled departure and was not offered an alternative flight within the timeframes prescribed by Article 5(1)(c). No satisfactory explanation was provided, and the carrier has not demonstrated extraordinary circumstances within the meaning of Article 5(3).

I request payment of ${p.compAmount || 'the applicable compensation'} within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a claim reference number.

If I do not receive a satisfactory response by that date, I will escalate this matter to the UK Civil Aviation Authority (CAA).

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function uk261_delayed(p) {
  const timingLine = (p.scheduledArrival && p.actualArrival && p.delayLabel)
    ? `\nFlight ${p.flightNumber} was scheduled to arrive at ${p.arrCity} at ${p.scheduledArrival} on ${p.flightDate} and arrived at ${p.actualArrival}, a delay of ${p.delayLabel}.\n`
    : '';

  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Delay Compensation Claim under UK Retained Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under the United Kingdom's retained version of EU Regulation 261/2004 (UK Statutory Instrument 2019 No. 278) in respect of the significant delay affecting flight ${p.flightNumber} from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.
${timingLine}
Under Article 7 of the retained UK Regulation, passengers who arrive at their final destination three or more hours after the scheduled arrival time are entitled to fixed compensation. This right was affirmed under the equivalent EU provision in Sturgeon and Others v Condor (Joined Cases C-402/07 and C-432/07), and the UK's Civil Aviation Authority has confirmed the same principle applies under the retained UK Regulation.

My arrival at ${p.arrCity} was delayed by three hours or more. The carrier has not provided evidence of extraordinary circumstances within the meaning of Article 5(3), nor demonstrated that all reasonable measures were taken to avoid the delay.

I am entitled to compensation of ${p.compAmount || 'the applicable statutory amount'} and request payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and issue a claim reference.

If I receive no satisfactory response, I will refer this matter to the UK Civil Aviation Authority.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function uk261_denied(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Denied Boarding Compensation Claim under UK Retained Regulation 261/2004

Dear Customer Relations Team,

I am writing to claim statutory compensation under the United Kingdom's retained version of EU Regulation 261/2004 (UK Statutory Instrument 2019 No. 278) in respect of being involuntarily denied boarding on flight ${p.flightNumber} from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Article 4 of the retained UK Regulation, where a carrier expects to deny boarding, it must first seek volunteers. Only where insufficient volunteers come forward may the carrier deny boarding involuntarily, and Article 4(3) requires the carrier to compensate affected passengers immediately in accordance with Article 7.

I held a confirmed reservation, complied with all check-in requirements, and presented myself at the gate within the required time. I was denied boarding against my will. I am therefore entitled to fixed compensation of ${p.compAmount || 'the applicable statutory amount'}, together with the rights to care and assistance under Article 9.

I request payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt and provide a claim reference number.

If I do not receive a satisfactory response, I will escalate to the UK Civil Aviation Authority (CAA).

${closingBlock(p.name, p.email, p.todayDate)}`;
}

// ─────────────────────────────────────────────
// Canada APPR templates (SOR/2019-150)
// ─────────────────────────────────────────────

function appr_controlled(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under Canada Air Passenger Protection Regulations

Dear Customer Relations Team,

I am writing to claim compensation under Canada's Air Passenger Protection Regulations (SOR/2019-150) in respect of the disruption to flight ${p.flightNumber}, scheduled from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under Section 19 of the Air Passenger Protection Regulations, where a flight disruption is within the airline's control and is not required for safety purposes, passengers are entitled to fixed minimum compensation based on the length of the delay at the final destination. The disruption to my flight was within the airline's control — it arose from an operational or commercial reason, not from safety-related grounds or circumstances outside the airline's control such as severe weather, air traffic control restrictions, or a security threat.

I am entitled to compensation of ${p.compAmount || 'the applicable minimum amount under SOR/2019-150'} and request payment within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}).

Under the Regulations, the airline must either pay the compensation within 30 days of the claim or, if it disputes liability, provide written reasons. Please confirm receipt of this claim, provide a reference number, and either process payment or provide written grounds for any refusal.

If I do not receive a satisfactory response, I will file a complaint with the Canadian Transportation Agency at https://otc-cta.gc.ca/eng/air-travel-complaints.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

function appr_uncontrolled(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation and Treatment Standards Claim under Canada Air Passenger Protection Regulations

Dear Customer Relations Team,

I am writing regarding the disruption to flight ${p.flightNumber}, scheduled from ${p.depCity} to ${p.arrCity} on ${p.flightDate}, under Canada's Air Passenger Protection Regulations (SOR/2019-150).

I understand the airline may characterize the disruption as outside its control. However, under Sections 10–18 of the Regulations, passengers are entitled to minimum treatment standards — including meals, refreshments, access to communication, and accommodation where applicable — regardless of the cause of the disruption. The airline has not confirmed that these standards were met in full.

Furthermore, under Section 19(3) of the Regulations, where a disruption is within the carrier's control for safety reasons, passengers are entitled to rebooking or a refund. I request written confirmation of the basis on which the airline claims the disruption was outside its control, along with evidence supporting that characterization.

If any portion of the disruption was within the airline's control, I am entitled to compensation of ${p.compAmount || 'the applicable amount under SOR/2019-150'}. I request a full written response within ${p.deadlineDays} days (by ${p.deadlineDate}).

If I do not receive a satisfactory response, I will file a complaint with the Canadian Transportation Agency.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

// ─────────────────────────────────────────────
// Turkey SHY template
// ─────────────────────────────────────────────

function shy_generic(p) {
  return `${p.name}
${p.address}
${p.email}
${bookingLine(p.bookingRef)}

${p.todayDate}

Customer Relations Department
${p.airlineName || 'The Airline'}

Re: Flight ${p.flightNumber} on ${p.flightDate} — Compensation Claim under Turkey SHY Passenger Regulation

Dear Customer Relations Team,

I am writing to claim statutory compensation under the Turkish SHY Passenger Regulation (Sivil Havacılık Yönetmeliği), enacted pursuant to Turkish Civil Aviation Law No. 2920, Article 143, in respect of the disruption to flight ${p.flightNumber} from ${p.depCity} to ${p.arrCity} on ${p.flightDate}.

Under the SHY Passenger Regulation, passengers affected by flight cancellations and significant delays are entitled to fixed compensation where the disruption is within the carrier's operational control and is not caused by extraordinary circumstances beyond the carrier's reasonable measures to prevent. The applicable compensation is ${p.compAmount || 'the statutory amount'}, denominated in EUR and payable in Turkish Lira at the exchange rate published by the Central Bank of the Republic of Turkey (TCMB) on the date of ticket purchase.

No adequate explanation for the disruption was communicated to me in advance, and I was not offered alternative arrangements within the timeframes required under the Regulation. I did not receive the care and assistance to which I was entitled during the disruption period.

I request payment of ${p.compAmount || 'the applicable compensation'} (in Turkish Lira at the TCMB rate on the ticket purchase date) within ${p.deadlineDays} days of this letter (by ${p.deadlineDate}). Please confirm receipt of this claim and provide a reference number.

If I do not receive a satisfactory response, I will escalate this matter to the Turkish Directorate General of Civil Aviation (SHGM — Sivil Havacılık Genel Müdürlüğü) at https://web.shgm.gov.tr.

${closingBlock(p.name, p.email, p.todayDate)}`;
}

// ─────────────────────────────────────────────
// Template registry
// ─────────────────────────────────────────────

const TEMPLATES = {
  // EU261
  EU261_cancelled_technical: eu261_cancelled_technical,
  EU261_cancelled_crew:      eu261_cancelled_technical, // crew = same legal position as technical
  EU261_cancelled_weather:   eu261_cancelled_weather,
  EU261_cancelled_other:     eu261_cancelled_none,
  EU261_cancelled_none:      eu261_cancelled_none,
  EU261_delayed_technical:   eu261_delayed_technical,
  EU261_delayed_crew:        eu261_delayed_technical,
  EU261_delayed_weather:     eu261_delayed_weather,
  EU261_delayed_other:       eu261_delayed_none,
  EU261_delayed_none:        eu261_delayed_none,
  EU261_denied_none:         eu261_denied,
  EU261_denied_technical:    eu261_denied,
  EU261_downgraded_none:     eu261_downgrade,
  // UK261
  UK261_cancelled_technical: uk261_cancelled,
  UK261_cancelled_crew:      uk261_cancelled,
  UK261_cancelled_weather:   uk261_cancelled,
  UK261_cancelled_other:     uk261_cancelled,
  UK261_cancelled_none:      uk261_cancelled,
  UK261_delayed_technical:   uk261_delayed,
  UK261_delayed_crew:        uk261_delayed,
  UK261_delayed_weather:     uk261_delayed,
  UK261_delayed_other:       uk261_delayed,
  UK261_delayed_none:        uk261_delayed,
  UK261_denied_none:         uk261_denied,
  UK261_denied_technical:    uk261_denied,
  UK261_downgraded_none:     eu261_downgrade, // same Article 10 logic
  // APPR
  APPR_cancelled_controlled:   appr_controlled,
  APPR_cancelled_safety:       appr_uncontrolled,
  APPR_cancelled_uncontrolled: appr_uncontrolled,
  APPR_cancelled_unknown:      appr_controlled,
  APPR_delayed_controlled:     appr_controlled,
  APPR_delayed_safety:         appr_uncontrolled,
  APPR_delayed_uncontrolled:   appr_uncontrolled,
  APPR_delayed_unknown:        appr_controlled,
  APPR_denied_controlled:      appr_controlled,
  // SHY
  SHY_cancelled_airline:       shy_generic,
  SHY_cancelled_forcemajeure:  shy_generic,
  SHY_cancelled_unknown:       shy_generic,
  SHY_delayed_airline:         shy_generic,
  SHY_delayed_forcemajeure:    shy_generic,
  SHY_delayed_unknown:         shy_generic,
  SHY_denied_airline:          shy_generic,
};

/**
 * Select a template function for the given parameters.
 * Returns null if no template matches — caller should fall back to Claude.
 *
 * @param {Object} opts
 * @param {string} opts.regulation  - 'EU261' | 'UK261' | 'APPR' | 'SHY'
 * @param {string} opts.disruption  - 'cancelled' | 'delayed' | 'denied' | 'downgraded'
 * @param {string} opts.reason      - 'technical' | 'crew' | 'weather' | 'none' | 'other' |
 *                                    'controlled' | 'uncontrolled' | 'safety' | 'unknown' |
 *                                    'airline' | 'forcemajeure' (SHY)
 * @returns {Function|null}
 */
export function selectTemplate({ regulation, disruption, reason }) {
  const key = `${regulation}_${disruption}_${reason || 'none'}`;
  if (TEMPLATES[key]) return TEMPLATES[key];
  // Broad fallback: regulation_disruption_none
  const broadKey = `${regulation}_${disruption}_none`;
  if (TEMPLATES[broadKey]) return TEMPLATES[broadKey];
  return null;
}

/**
 * Build the params object expected by all template functions.
 * Call this before invoking a template function.
 *
 * @param {Object} opts
 * @param {Object} opts.answers     - claimData from checker (flightNumber, flightDate, from, to …)
 * @param {Object} opts.result      - eligibility result (regulation, compensation, distanceKm …)
 * @param {Object} opts.details     - passenger details (name, email, address, bookingRef …)
 * @param {Object} opts.flightDetails - optional timing (scheduledTime, actualTime, incidentDescription)
 * @param {Object} opts.depInfo     - airport info from eu261.js
 * @param {Object} opts.arrInfo
 * @param {string} opts.airlineName - resolved airline name
 * @returns {Object}
 */
export function buildTemplateParams({ answers, result, details, flightDetails, depInfo, arrInfo, airlineName }) {
  const regulation = result?.regulation || 'EU261';
  const deadlineDays = (regulation === 'APPR' || regulation === 'SHY') ? 30 : 14;

  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const deadlineDate = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const from = answers?.from || '';
  const to = answers?.to || '';
  const depCity = depInfo ? `${depInfo.city} (${from.toUpperCase()})` : from.toUpperCase();
  const arrCity = arrInfo ? `${arrInfo.city} (${to.toUpperCase()})` : to.toUpperCase();

  // Delay duration
  let delayLabel = null;
  const { scheduledTime, actualTime } = flightDetails || {};
  if (scheduledTime && actualTime) {
    const [sh, sm] = scheduledTime.split(':').map(Number);
    const [ah, am] = actualTime.split(':').map(Number);
    let mins = (ah * 60 + am) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    if (mins > 0) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      delayLabel = h > 0 ? (m > 0 ? `${h} hours and ${m} minutes` : `${h} hour${h !== 1 ? 's' : ''}`) : `${m} minutes`;
    }
  }

  return {
    name:             details?.name || '',
    address:          details?.address || '',
    email:            details?.email || '',
    bookingRef:       details?.bookingRef || answers?.bookingRef || '',
    flightNumber:     answers?.flightNumber || '',
    flightDate:       answers?.flightDate || '',
    depCity,
    arrCity,
    distanceKm:       result?.distanceKm || null,
    compAmount:       result?.compensation?.amount || null,
    deadlineDays,
    deadlineDate,
    todayDate,
    airlineName:      airlineName || '',
    scheduledArrival: scheduledTime || '',
    actualArrival:    actualTime || '',
    delayLabel,
  };
}
