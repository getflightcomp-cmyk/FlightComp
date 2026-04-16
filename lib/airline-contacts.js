/* ════════════════════════════════════════════════════
   Airline Claims Contact Directory
   Used by the PDF claim kit for submission instructions.
   Keys: IATA 2-letter carrier code
════════════════════════════════════════════════════ */

export const AIRLINE_CONTACTS = {
  // ── EU carriers ───────────────────────────────────
  FR: {
    name: 'Ryanair',
    claimsEmail: null,
    claimsFormUrl: 'https://www.ryanair.com/gb/en/useful-info/help-centre/claims-eu261',
    mailingAddress: 'Ryanair DAC, Corporate Head Office, Airside Business Park, Swords, Co. Dublin, Ireland',
  },
  U2: {
    name: 'easyJet',
    claimsEmail: 'claims@easyjet.com',
    claimsFormUrl: 'https://www.easyjet.com/en/help/compensation',
    mailingAddress: 'easyJet UK Ltd, Hangar 89, London Luton Airport, Luton, Bedfordshire, LU2 9PF, UK',
  },
  LH: {
    name: 'Lufthansa',
    claimsEmail: 'customer.relations@lufthansa.com',
    claimsFormUrl: 'https://www.lufthansa.com/eu/en/compensation-claim',
    mailingAddress: 'Lufthansa Customer Relations, Lufthansa Aviation Center, Airportring, 60546 Frankfurt am Main, Germany',
  },
  AF: {
    name: 'Air France',
    claimsEmail: 'customer.relations@airfrance.fr',
    claimsFormUrl: 'https://wwws.airfrance.fr/en/compensation-claim',
    mailingAddress: 'Air France Customer Relations, 45 rue de Paris, 95747 Roissy CDG Cedex, France',
  },
  KL: {
    name: 'KLM',
    claimsEmail: 'customercare@klm.com',
    claimsFormUrl: 'https://www.klm.com/travel/en_gb/customer_support/claim',
    mailingAddress: 'KLM Royal Dutch Airlines, Customer Relations, PO Box 7700, 1117 ZL Schiphol Airport, Netherlands',
  },
  VY: {
    name: 'Vueling',
    claimsEmail: 'eu261@vueling.com',
    claimsFormUrl: 'https://www.vueling.com/en/help/compensation',
    mailingAddress: 'Vueling Airlines, Customer Care, Calle Paredes de la Creu 2, 08820 El Prat de Llobregat, Barcelona, Spain',
  },
  W6: {
    name: 'Wizz Air',
    claimsEmail: 'customerrelations@wizzair.com',
    claimsFormUrl: 'https://wizzair.com/en-gb/information-and-services/customer-care/compensation',
    mailingAddress: 'Wizz Air Hungary Ltd, Laurus Offices, Könyves Kálmán krt. 12-14, 1097 Budapest, Hungary',
  },
  TP: {
    name: 'TAP Air Portugal',
    claimsEmail: 'claims@tap.pt',
    claimsFormUrl: 'https://www.flytap.com/en-gb/help/compensation',
    mailingAddress: 'TAP Air Portugal, Customer Relations, Edifício 25, Aeroporto de Lisboa, 1704-801 Lisboa, Portugal',
  },
  SK: {
    name: 'SAS',
    claimsEmail: 'sasservice@sas.se',
    claimsFormUrl: 'https://www.flysas.com/en/help/claims',
    mailingAddress: 'SAS Scandinavian Airlines, Customer Relations, SE-195 87 Stockholm, Sweden',
  },
  AY: {
    name: 'Finnair',
    claimsEmail: 'customer.relations@finnair.com',
    claimsFormUrl: 'https://www.finnair.com/gb/en/faq/compensation',
    mailingAddress: 'Finnair Plc, Customer Relations, Tietotie 11 A, FI-01053 FINNAIR, Finland',
  },
  IB: {
    name: 'Iberia',
    claimsEmail: 'clienteiberia@iberia.es',
    claimsFormUrl: 'https://www.iberia.com/en/atention-al-cliente/claims',
    mailingAddress: 'Iberia Customer Relations, Calle Martínez Villergas 49, 28027 Madrid, Spain',
  },
  AZ: {
    name: 'ITA Airways',
    claimsEmail: 'ccare@itaairways.com',
    claimsFormUrl: 'https://www.itaairways.com/en/legal-information',
    mailingAddress: 'ITA Airways, Customer Care, Piazza Almerico da Schio, 00054 Fiumicino, Rome, Italy',
  },
  OS: {
    name: 'Austrian Airlines',
    claimsEmail: 'customer.relations@aua.com',
    claimsFormUrl: 'https://www.austrian.com/gb/en/compensation',
    mailingAddress: 'Austrian Airlines, Customer Relations, Postfach 100, 1300 Wien Flughafen, Austria',
  },
  LX: {
    name: 'Swiss International Air Lines',
    claimsEmail: 'customer.relations@swiss.com',
    claimsFormUrl: 'https://www.swiss.com/gb/en/fly/legal/passenger-rights',
    mailingAddress: 'SWISS Customer Relations, Sägereistrasse 27, P.O. Box, 8058 Zurich-Airport, Switzerland',
  },
  SN: {
    name: 'Brussels Airlines',
    claimsEmail: 'customer.relations@brusselsairlines.com',
    claimsFormUrl: 'https://www.brusselsairlines.com/en-gb/practical-information/eu-regulation.aspx',
    mailingAddress: 'Brussels Airlines, Customer Relations, Brussels Airport, Ringroad, 1930 Zaventem, Belgium',
  },
  DY: {
    name: 'Norwegian Air Shuttle',
    claimsEmail: 'customer.relations@norwegian.com',
    claimsFormUrl: 'https://www.norwegian.com/en/help/customer-relations',
    mailingAddress: 'Norwegian Air Shuttle ASA, Customer Relations, Oksenøyveien 3, 1366 Lysaker, Norway',
  },
  EW: {
    name: 'Eurowings',
    claimsEmail: 'customer.relations@eurowings.com',
    claimsFormUrl: 'https://www.eurowings.com/en/information/rights.html',
    mailingAddress: 'Eurowings GmbH, Customer Relations, Germanwings-Strasse 1, 51147 Köln, Germany',
  },
  HV: {
    name: 'Transavia',
    claimsEmail: 'customercare@transavia.com',
    claimsFormUrl: 'https://www.transavia.com/en-EU/home/claim',
    mailingAddress: 'Transavia Airlines, Customer Relations, PO Box 7777, 1118 ZM Schiphol, Netherlands',
  },
  EI: {
    name: 'Aer Lingus',
    claimsEmail: 'customerrelations@aerlingus.com',
    claimsFormUrl: 'https://www.aerlingus.com/help-centre/compensation',
    mailingAddress: 'Aer Lingus, Customer Relations, Dublin Airport, Co. Dublin, Ireland D17 AK82',
  },
  LO: {
    name: 'LOT Polish Airlines',
    claimsEmail: 'obslugazwrotow@lot.com',
    claimsFormUrl: 'https://www.lot.com/en/compensation',
    mailingAddress: 'LOT Polish Airlines, Customer Relations, ul. Komitetu Obrony Robotników 43, 02-146 Warsaw, Poland',
  },
  // ── UK carriers ───────────────────────────────────
  BA: {
    name: 'British Airways',
    claimsEmail: 'customer.relations@ba.com',
    claimsFormUrl: 'https://www.britishairways.com/en-gb/information/legal/eu-261-claim',
    mailingAddress: 'British Airways, Customer Relations, PO Box 5619, Sudbury, CO10 2PG, UK',
  },
  VS: {
    name: 'Virgin Atlantic',
    claimsEmail: 'customer.relations@fly.virgin.com',
    claimsFormUrl: 'https://help.virginatlantic.com/eu261',
    mailingAddress: 'Virgin Atlantic Airways, Customer Relations, The VHQ, Fleming Way, Crawley, West Sussex, RH10 9DF, UK',
  },
  LS: {
    name: 'Jet2',
    claimsEmail: 'customercare@jet2.com',
    claimsFormUrl: 'https://www.jet2.com/help/customer-care',
    mailingAddress: 'Jet2.com, Customer Care, Low Fare Finder House, Leeds Bradford Airport, Leeds, LS19 7TU, UK',
  },
  BY: {
    name: 'TUI Airways',
    claimsEmail: 'customerrelations@tui.co.uk',
    claimsFormUrl: 'https://www.tui.co.uk/help-hub',
    mailingAddress: 'TUI Airways, Customer Relations, TUI House, Wigmore Road, Luton, Bedfordshire, LU2 9TN, UK',
  },
  ZT: {
    name: 'TUI Airways',
    claimsEmail: 'customerrelations@tui.co.uk',
    claimsFormUrl: 'https://www.tui.co.uk/help-hub',
    mailingAddress: 'TUI Airways, Customer Relations, TUI House, Wigmore Road, Luton, Bedfordshire, LU2 9TN, UK',
  },
  // ── Canadian carriers ─────────────────────────────
  AC: {
    name: 'Air Canada',
    claimsEmail: null,
    claimsFormUrl: 'https://www.aircanada.com/ca/en/aco/home/plan/customer-support/appr.html',
    mailingAddress: 'Air Canada, Customer Relations, PO Box 64239, RPO Thorncliffe, Calgary, Alberta T2K 6J7, Canada',
  },
  WS: {
    name: 'WestJet',
    claimsEmail: 'appr@westjet.com',
    claimsFormUrl: 'https://www.westjet.com/en-ca/legal/air-passenger-protection-regulations',
    mailingAddress: 'WestJet Airlines, Customer Relations, 21 Aerial Place NE, Calgary, AB T2E 8X7, Canada',
  },
  F8: {
    name: 'Flair Airlines',
    claimsEmail: 'guestcare@flyflair.com',
    claimsFormUrl: 'https://flyflair.com/help',
    mailingAddress: 'Flair Airlines Ltd, Customer Relations, #10, 4229 99 Street NW, Edmonton, AB T6E 5B7, Canada',
  },
  PD: {
    name: 'Porter Airlines',
    claimsEmail: 'customercare@flyporter.com',
    claimsFormUrl: 'https://www.flyporter.com/en-ca/travel-information/policies/air-passenger-protection',
    mailingAddress: 'Porter Airlines, Customer Relations, Billy Bishop Toronto City Airport, Toronto, ON M5V 1A1, Canada',
  },
  TS: {
    name: 'Air Transat',
    claimsEmail: 'satisfaction@transat.com',
    claimsFormUrl: 'https://www.airtransat.com/en-CA/Travel-info/Air-Passenger-Protection-Regulations',
    mailingAddress: 'Air Transat A.T. Inc., Customer Relations, 300 Léo-Pariseau, Suite 600, Montréal, QC H2X 4C2, Canada',
  },
  WG: {
    name: 'Sunwing Airlines',
    claimsEmail: 'customerrelations@sunwing.ca',
    claimsFormUrl: 'https://www.sunwing.ca/en/support',
    mailingAddress: 'Sunwing Airlines, Customer Relations, 5765 Yonge Street, Suite 600, Toronto, ON M2M 4H9, Canada',
  },
  // ── Turkish carriers ──────────────────────────────
  TK: {
    name: 'Turkish Airlines',
    claimsEmail: 'ccare@thy.com',
    claimsFormUrl: 'https://www.turkishairlines.com/en-gb/any-questions/compensation-request',
    mailingAddress: 'Turkish Airlines, Customer Relations, General Management Building, Atatürk Airport, 34149 Yeşilköy, Istanbul, Turkey',
  },
  PC: {
    name: 'Pegasus Airlines',
    claimsEmail: 'iletisim@flypgs.com',
    claimsFormUrl: 'https://www.flypgs.com/en/useful-info/customer-support',
    mailingAddress: 'Pegasus Hava Taşımacılığı A.Ş., Customer Relations, Yenişehir Mah. Osmanlı Bulvarı No:11/A, 34912 Kurtköy-Pendik, Istanbul, Turkey',
  },
  XQ: {
    name: 'SunExpress',
    claimsEmail: 'contact@sunexpress.com',
    claimsFormUrl: 'https://www.sunexpress.com/en/service',
    mailingAddress: 'SunExpress Airlines, Customer Relations, Gazipaşa Sokak No.7/B, 07040 Antalya, Turkey',
  },
};

// Escalation authorities by regulation
const ESCALATION_AUTHORITIES = {
  UK261: {
    name: 'UK Civil Aviation Authority (CAA)',
    url: 'https://www.caa.co.uk/passengers/resolving-travel-problems/delays-and-cancellations/options/complain-to-the-caa/',
    note: 'File a free complaint if the airline rejects or ignores your claim after 8 weeks.',
  },
  APPR: {
    name: 'Canadian Transportation Agency (CTA)',
    url: 'https://otc-cta.gc.ca/eng/air-travel-complaints',
    note: 'File an online complaint for free. The CTA has legal authority to order airlines to pay compensation.',
  },
  SHY: {
    name: 'Directorate General of Civil Aviation (SHGM)',
    url: 'https://web.shgm.gov.tr',
    note: 'Submit a passenger complaint through the SHGM online portal.',
  },
};

// EU261 NEB by departure country code
const EU_NEB = {
  GB: { name: 'UK Civil Aviation Authority (CAA)' },
  FR: { name: 'Direction Générale de l\'Aviation Civile (DGAC)' },
  DE: { name: 'Luftfahrt-Bundesamt (LBA)' },
  NL: { name: 'Inspectie Leefomgeving en Transport (ILT)' },
  ES: { name: 'Agencia Estatal de Seguridad Aérea (AESA)' },
  IT: { name: 'Ente Nazionale per l\'Aviazione Civile (ENAC)' },
  BE: { name: 'Federal Public Service Mobility and Transport' },
  PT: { name: 'Autoridade Nacional da Aviação Civil (ANAC)' },
  IE: { name: 'Commission for Aviation Regulation (CAR)' },
  DK: { name: 'Danish Transport, Construction and Housing Authority (Trafikstyrelsen)' },
  SE: { name: 'Swedish Consumer Agency (Konsumentverket)' },
  FI: { name: 'Finnish Transport and Communications Agency (Traficom)' },
  NO: { name: 'Norwegian Civil Aviation Authority (Luftfartstilsynet)' },
  PL: { name: 'Civil Aviation Authority (ULC)' },
  AT: { name: 'Agentur für Passagier- und Fahrgastrechte (APF)' },
  GR: { name: 'Hellenic Civil Aviation Authority (HCAA)' },
  CH: { name: 'Federal Office of Civil Aviation (FOCA)' },
  CZ: { name: 'Civil Aviation Authority of Czech Republic' },
  HU: { name: 'Hungarian Aviation Authority' },
  RO: { name: 'Romanian Civil Aeronautical Authority (RCAA)' },
  HR: { name: 'Croatian Civil Aviation Agency' },
};

const COUNTRY_NAME_TO_CODE = {
  'UK': 'GB', 'GB': 'GB', 'France': 'FR', 'Germany': 'DE', 'Netherlands': 'NL',
  'Spain': 'ES', 'Italy': 'IT', 'Belgium': 'BE', 'Portugal': 'PT',
  'Ireland': 'IE', 'Denmark': 'DK', 'Sweden': 'SE', 'Finland': 'FI',
  'Norway': 'NO', 'Poland': 'PL', 'Austria': 'AT', 'Greece': 'GR',
  'Czech Rep.': 'CZ', 'Czech Republic': 'CZ', 'Hungary': 'HU',
  'Romania': 'RO', 'Croatia': 'HR', 'Switzerland': 'CH',
};

// Reverse map: ISO code → display name (used in fallback NEB text)
const CODE_TO_COUNTRY = {
  'GB': 'UK', 'FR': 'France', 'DE': 'Germany', 'NL': 'Netherlands',
  'ES': 'Spain', 'IT': 'Italy', 'BE': 'Belgium', 'PT': 'Portugal',
  'IE': 'Ireland', 'DK': 'Denmark', 'SE': 'Sweden', 'FI': 'Finland',
  'NO': 'Norway', 'PL': 'Poland', 'AT': 'Austria', 'GR': 'Greece',
  'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'HR': 'Croatia',
  'CH': 'Switzerland',
};

// ── ICAO 3-letter → IATA 2-letter carrier code map ───────────────────────────
const ICAO_TO_IATA = {
  EZY: 'U2',  // easyJet
  RYR: 'FR',  // Ryanair
  BAW: 'BA',  // British Airways
  DLH: 'LH',  // Lufthansa
  THY: 'TK',  // Turkish Airlines
  AFR: 'AF',  // Air France
  KLM: 'KL',  // KLM
  IBE: 'IB',  // Iberia
  AZA: 'AZ',  // ITA Airways
  SAS: 'SK',  // SAS Scandinavian
  SWR: 'LX',  // Swiss
  AUA: 'OS',  // Austrian Airlines
  BEL: 'SN',  // Brussels Airlines
  TAP: 'TP',  // TAP Air Portugal
  EIN: 'EI',  // Aer Lingus
  WZZ: 'W6',  // Wizz Air
  VLG: 'VY',  // Vueling
  NAX: 'DY',  // Norwegian
  PGT: 'PC',  // Pegasus Airlines
  TOM: 'BY',  // TUI Airways
  EXS: 'LS',  // Jet2
  ACA: 'AC',  // Air Canada
  WJA: 'WS',  // WestJet
  TSC: 'TS',  // Air Transat
  POE: 'PD',  // Porter Airlines
  EWG: 'EW',  // Eurowings
  TRA: 'HV',  // Transavia
  SVA: 'SV',  // Saudia (bonus)
  ETH: 'ET',  // Ethiopian (bonus)
};

// ── Fuzzy name resolver ───────────────────────────────────────────────────────
// Handles case-insensitive, space-variation, partial, and abbreviation matches.
function resolveByName(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  const qNorm = q.replace(/[-\s]+/g, '');

  // Pass 1: exact name match (normalised spaces)
  for (const info of Object.values(AIRLINE_CONTACTS)) {
    if (info.name.toLowerCase().replace(/[-\s]+/g, '') === qNorm) return info;
  }
  // Pass 2: query is a whole word inside the name (e.g. "turkish" → "Turkish Airlines")
  for (const info of Object.values(AIRLINE_CONTACTS)) {
    const words = info.name.toLowerCase().split(/\s+/);
    if (words.some(w => w === q)) return info;
  }
  // Pass 3: name contains the query as a substring (min 4 chars to avoid noise)
  if (q.length >= 4) {
    for (const info of Object.values(AIRLINE_CONTACTS)) {
      if (info.name.toLowerCase().includes(q)) return info;
    }
  }
  return null;
}

/**
 * Look up airline contact info by IATA code, ICAO code, flight number, or
 * fuzzy airline name. Resolution order:
 *   1. Direct IATA key (e.g. "U2")
 *   2. Direct ICAO key → IATA lookup (e.g. "EZY" → "U2")
 *   3. ICAO prefix extracted from flight number (e.g. "EZY8001" → "EZY")
 *   4. IATA prefix extracted from flight number (e.g. "U28001" → "U2")
 *   5. Fuzzy airline name match
 */
export function getAirlineContact(input) {
  if (!input) return null;
  const stripped = input.trim().toUpperCase().replace(/\s+/g, '');

  // 1. Direct IATA key
  if (AIRLINE_CONTACTS[stripped]) return AIRLINE_CONTACTS[stripped];

  // 2. Direct ICAO key
  const iataFromIcao = ICAO_TO_IATA[stripped];
  if (iataFromIcao && AIRLINE_CONTACTS[iataFromIcao]) return AIRLINE_CONTACTS[iataFromIcao];

  // 3. ICAO prefix from flight number — 3 alpha chars followed by digits
  const icaoM = stripped.match(/^([A-Z]{3})\d/);
  if (icaoM) {
    const ic = icaoM[1];
    if (AIRLINE_CONTACTS[ic]) return AIRLINE_CONTACTS[ic];
    const ia = ICAO_TO_IATA[ic];
    if (ia && AIRLINE_CONTACTS[ia]) return AIRLINE_CONTACTS[ia];
  }

  // 4. IATA prefix from flight number — 2 alpha chars followed by digits
  const iataM = stripped.match(/^([A-Z]{2})\d/);
  if (iataM && AIRLINE_CONTACTS[iataM[1]]) return AIRLINE_CONTACTS[iataM[1]];

  // 5. Fuzzy name match
  return resolveByName(input.trim()) || null;
}

/**
 * Get escalation authority for a regulation + departure info.
 */
export function getEscalationAuthority(regulation, depInfo) {
  if (ESCALATION_AUTHORITIES[regulation]) return ESCALATION_AUTHORITIES[regulation];
  // EU261 — use NEB by departure country
  if (regulation === 'EU261' && depInfo?.country) {
    const code = COUNTRY_NAME_TO_CODE[depInfo.country] || depInfo.country;
    const neb = EU_NEB[code];
    if (neb) return { name: neb.name };
    // Unknown EU country — use full country name, never ISO code
    const displayName = CODE_TO_COUNTRY[code] || CODE_TO_COUNTRY[depInfo.country] || depInfo.country;
    return { name: `National Enforcement Body of ${displayName}` };
  }
  return { name: 'National Enforcement Body (NEB)' };
}

/**
 * Response deadline in days for a regulation's claim letter.
 */
export function getResponseDeadlineDays(regulation) {
  return (regulation === 'APPR' || regulation === 'SHY') ? 30 : 14;
}
