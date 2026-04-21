/* ════════════════════════════════════════════════════
   Carrier Registry — IATA code → region + metadata
════════════════════════════════════════════════════ */

// region: 'EU' | 'UK' | 'TR' | 'CA' | 'OTHER'
const CARRIERS = {
  // ── EU carriers ──────────────────────────────────
  LH: { name: 'Lufthansa',          region: 'EU' },
  AF: { name: 'Air France',         region: 'EU' },
  KL: { name: 'KLM',                region: 'EU' },
  IB: { name: 'Iberia',             region: 'EU' },
  AZ: { name: 'ITA Airways',        region: 'EU' },
  SK: { name: 'SAS',                region: 'EU' },
  FR: { name: 'Ryanair',            region: 'EU' },
  U2: { name: 'easyJet',            region: 'EU' },
  W6: { name: 'Wizz Air',           region: 'EU' },
  VY: { name: 'Vueling',            region: 'EU' },
  LX: { name: 'Swiss',              region: 'EU' },
  OS: { name: 'Austrian Airlines',  region: 'EU' },
  SN: { name: 'Brussels Airlines',  region: 'EU' },
  TP: { name: 'TAP Portugal',       region: 'EU' },
  AY: { name: 'Finnair',            region: 'EU' },
  EI: { name: 'Aer Lingus',         region: 'EU' },
  LO: { name: 'LOT Polish Airlines',region: 'EU' },
  OK: { name: 'Czech Airlines',     region: 'EU' },
  RO: { name: 'Tarom',              region: 'EU' },
  A3: { name: 'Aegean Airlines',    region: 'EU' },
  EW: { name: 'Eurowings',          region: 'EU' },
  DE: { name: 'Condor',             region: 'EU' },
  DY: { name: 'Norwegian',          region: 'EU' },
  BT: { name: 'airBaltic',          region: 'EU' },
  // ── UK carriers ──────────────────────────────────
  BA: { name: 'British Airways',    region: 'UK' },
  VS: { name: 'Virgin Atlantic',    region: 'UK' },
  LS: { name: 'Jet2',               region: 'UK' },
  ZT: { name: 'TUI Airways',        region: 'UK' },
  MT: { name: 'Thomas Cook',        region: 'UK' }, // defunct — historical claims
  // ── Turkish carriers ─────────────────────────────
  TK: { name: 'Turkish Airlines',   region: 'TR' },
  PC: { name: 'Pegasus Airlines',   region: 'TR' },
  XQ: { name: 'SunExpress',         region: 'TR' },
  TN: { name: 'AnadoluJet',         region: 'TR' },
  XC: { name: 'Corendon Airlines',  region: 'TR' },
  // ── Canadian carriers ────────────────────────────
  AC: { name: 'Air Canada',         region: 'CA' },
  WS: { name: 'WestJet',            region: 'CA' },
  WG: { name: 'Sunwing',            region: 'CA' },
  TS: { name: 'Air Transat',        region: 'CA' },
  F8: { name: 'Flair Airlines',     region: 'CA' },
  PD: { name: 'Porter Airlines',    region: 'CA' },
  '5T': { name: 'Canadian North',   region: 'CA' },
  // ── US carriers ──────────────────────────────────
  AA: { name: 'American Airlines',  region: 'OTHER' },
  DL: { name: 'Delta Air Lines',    region: 'OTHER' },
  UA: { name: 'United Airlines',    region: 'OTHER' },
  B6: { name: 'JetBlue Airways',    region: 'OTHER' },
  AS: { name: 'Alaska Airlines',    region: 'OTHER' },
  NK: { name: 'Spirit Airlines',    region: 'OTHER' },
  F9: { name: 'Frontier Airlines',  region: 'OTHER' },
  // ── Middle Eastern carriers ──────────────────────
  EK: { name: 'Emirates',           region: 'OTHER' },
  QR: { name: 'Qatar Airways',      region: 'OTHER' },
  EY: { name: 'Etihad Airways',     region: 'OTHER' },
  SV: { name: 'Saudia',             region: 'OTHER' },
  GF: { name: 'Gulf Air',           region: 'OTHER' },
  WY: { name: 'Oman Air',           region: 'OTHER' },
  KU: { name: 'Kuwait Airways',     region: 'OTHER' },
  RJ: { name: 'Royal Jordanian',    region: 'OTHER' },
  // ── Asian carriers ───────────────────────────────
  SQ: { name: 'Singapore Airlines', region: 'OTHER' },
  CX: { name: 'Cathay Pacific',     region: 'OTHER' },
  JL: { name: 'Japan Airlines',     region: 'OTHER' },
  NH: { name: 'All Nippon Airways', region: 'OTHER' },
  KE: { name: 'Korean Air',         region: 'OTHER' },
  OZ: { name: 'Asiana Airlines',    region: 'OTHER' },
  CA: { name: 'Air China',          region: 'OTHER' },
  CZ: { name: 'China Southern Airlines', region: 'OTHER' },
  MU: { name: 'China Eastern Airlines', region: 'OTHER' },
  BR: { name: 'EVA Air',            region: 'OTHER' },
  CI: { name: 'China Airlines',     region: 'OTHER' },
  // ── Southeast Asian / Oceania ────────────────────
  TG: { name: 'Thai Airways',       region: 'OTHER' },
  VN: { name: 'Vietnam Airlines',   region: 'OTHER' },
  PR: { name: 'Philippine Airlines',region: 'OTHER' },
  GA: { name: 'Garuda Indonesia',   region: 'OTHER' },
  MH: { name: 'Malaysia Airlines',  region: 'OTHER' },
  QF: { name: 'Qantas',             region: 'OTHER' },
  NZ: { name: 'Air New Zealand',    region: 'OTHER' },
  // ── African carriers ─────────────────────────────
  MS: { name: 'EgyptAir',           region: 'OTHER' },
  ET: { name: 'Ethiopian Airlines', region: 'OTHER' },
  AT: { name: 'Royal Air Maroc',    region: 'OTHER' },
  KQ: { name: 'Kenya Airways',      region: 'OTHER' },
  // ── Indian carriers ──────────────────────────────
  AI: { name: 'Air India',          region: 'OTHER' },
  '6E': { name: 'IndiGo',           region: 'OTHER' },
  SG: { name: 'SpiceJet',           region: 'OTHER' },
  // Note: 'UK' is Vistara's IATA code; region 'OTHER' → no collision with UK region logic
  'UK': { name: 'Vistara',          region: 'OTHER' },
  IX: { name: 'Air India Express',  region: 'OTHER' },
  // ── Latin American carriers ───────────────────────
  AV: { name: 'Avianca',            region: 'OTHER' },
  LA: { name: 'LATAM Airlines',     region: 'OTHER' },
  AM: { name: 'Aeroméxico',         region: 'OTHER' },
  CM: { name: 'Copa Airlines',      region: 'OTHER' },
  G3: { name: 'GOL Linhas Aéreas',  region: 'OTHER' },
  // ── Israeli carriers ─────────────────────────────
  LY: { name: 'El Al',              region: 'OTHER' },
};

// Large Canadian carriers for APPR tier determination
const LARGE_CANADIAN_CARRIERS = new Set(['AC', 'WS', 'WG', 'TS', 'F8', 'PD']);

// Airline name → IATA code (lowercase keys for fuzzy matching)
const NAME_TO_IATA = {
  // ── EU carriers ──────────────────────────────────
  'lufthansa': 'LH',
  'air france': 'AF',
  'airfrance': 'AF',
  'klm': 'KL',
  'iberia': 'IB',
  'ita airways': 'AZ',
  'ita': 'AZ',
  'alitalia': 'AZ',
  'sas': 'SK',
  'scandinavian': 'SK',
  'ryanair': 'FR',
  'easyjet': 'U2',
  'easy jet': 'U2',
  'wizz air': 'W6',
  'wizzair': 'W6',
  'wizz': 'W6',
  'vueling': 'VY',
  'swiss': 'LX',
  'swiss air': 'LX',
  'swissair': 'LX',
  'austrian': 'OS',
  'austrian airlines': 'OS',
  'brussels airlines': 'SN',
  'tap': 'TP',
  'tap portugal': 'TP',
  'tap air portugal': 'TP',
  'finnair': 'AY',
  'aer lingus': 'EI',
  'lot': 'LO',
  'lot polish': 'LO',
  'polish airlines': 'LO',
  'czech airlines': 'OK',
  'tarom': 'RO',
  'aegean': 'A3',
  'eurowings': 'EW',
  'condor': 'DE',
  'norwegian': 'DY',
  'norwegian air': 'DY',
  'airbaltic': 'BT',
  'air baltic': 'BT',
  // ── UK carriers ──────────────────────────────────
  'british airways': 'BA',
  'ba': 'BA',
  'virgin atlantic': 'VS',
  'virgin': 'VS',
  'jet2': 'LS',
  'tui airways': 'ZT',
  'tui': 'ZT',
  'thomas cook': 'MT',
  // ── Turkish carriers ─────────────────────────────
  'turkish airlines': 'TK',
  'turkish': 'TK',
  'thy': 'TK',
  'pegasus': 'PC',
  'pegasus airlines': 'PC',
  'sunexpress': 'XQ',
  'sun express': 'XQ',
  'anadolujet': 'TN',
  'anadolu jet': 'TN',
  'corendon': 'XC',
  'corendon airlines': 'XC',
  // ── Canadian carriers ────────────────────────────
  'air canada': 'AC',
  'westjet': 'WS',
  'west jet': 'WS',
  'sunwing': 'WG',
  'air transat': 'TS',
  'transat': 'TS',
  'flair': 'F8',
  'flair airlines': 'F8',
  'porter': 'PD',
  'porter airlines': 'PD',
  'canadian north': '5T',
  // ── Common misspellings (EU/UK) ───────────────────
  'luftansa': 'LH',
  'luthansa': 'LH',
  'lufthansa airlines': 'LH',
  'air fance': 'AF',
  'arian france': 'AF',
  'airfance': 'AF',
  'brittish airways': 'BA',
  'britsh airways': 'BA',
  'british airway': 'BA',
  'british air': 'BA',
  'turksh airlines': 'TK',
  'turkish airline': 'TK',
  'turkisch airlines': 'TK',
  'turk airlines': 'TK',
  'eazyjet': 'U2',
  'easyjet europe': 'U2',
  'ryan air': 'FR',
  'ryan-air': 'FR',
  'klm royal': 'KL',
  'klm dutch': 'KL',
  'swiss international': 'LX',
  'swiss airlines': 'LX',
  'wizzair hungary': 'W6',
  'wiz air': 'W6',
  'norwegian air shuttle': 'DY',
  'aer lingis': 'EI',
  'aerlingus': 'EI',
  'sunexpress airlines': 'XQ',
  'pegasus air': 'PC',
  'air canada airlines': 'AC',
  'west jet airlines': 'WS',
  'air transaat': 'TS',
  // ── US carriers ──────────────────────────────────
  'american airlines': 'AA',
  'american': 'AA',
  'aa': 'AA',
  'delta': 'DL',
  'delta air lines': 'DL',
  'delta airlines': 'DL',
  'dal': 'DL',
  'united': 'UA',
  'united airlines': 'UA',
  'ua': 'UA',
  'jetblue': 'B6',
  'jet blue': 'B6',
  'jetblue airways': 'B6',
  'alaska airlines': 'AS',
  'alaska air': 'AS',
  'alaska': 'AS',
  'spirit': 'NK',
  'spirit airlines': 'NK',
  'frontier': 'F9',
  'frontier airlines': 'F9',
  // ── Middle Eastern carriers ───────────────────────
  'emirates': 'EK',
  'emirates airlines': 'EK',
  'qatar airways': 'QR',
  'qatar': 'QR',
  'etihad': 'EY',
  'etihad airways': 'EY',
  'saudia': 'SV',
  'saudi airlines': 'SV',
  'saudi arabian airlines': 'SV',
  'gulf air': 'GF',
  'gulfair': 'GF',
  'oman air': 'WY',
  'omanair': 'WY',
  'kuwait airways': 'KU',
  'royal jordanian': 'RJ',
  // ── Asian carriers ────────────────────────────────
  'singapore airlines': 'SQ',
  'singapore air': 'SQ',
  'singapore': 'SQ',
  'cathay pacific': 'CX',
  'cathay': 'CX',
  'japan airlines': 'JL',
  'jal': 'JL',
  'ana': 'NH',
  'all nippon': 'NH',
  'all nippon airways': 'NH',
  'korean air': 'KE',
  'korean airlines': 'KE',
  'asiana': 'OZ',
  'asiana airlines': 'OZ',
  'air china': 'CA',
  'china southern': 'CZ',
  'china southern airlines': 'CZ',
  'china eastern': 'MU',
  'china eastern airlines': 'MU',
  'eva air': 'BR',
  'evaair': 'BR',
  'china airlines': 'CI',
  // ── Southeast Asian / Oceania ─────────────────────
  'thai airways': 'TG',
  'thai': 'TG',
  'vietnam airlines': 'VN',
  'philippine airlines': 'PR',
  'garuda': 'GA',
  'garuda indonesia': 'GA',
  'malaysia airlines': 'MH',
  'malaysia': 'MH',
  'qantas': 'QF',
  'air new zealand': 'NZ',
  'air nz': 'NZ',
  'new zealand': 'NZ',
  // ── African carriers ──────────────────────────────
  'egyptair': 'MS',
  'egypt air': 'MS',
  'ethiopian': 'ET',
  'ethiopian airlines': 'ET',
  'royal air maroc': 'AT',
  'air maroc': 'AT',
  'kenya airways': 'KQ',
  'kenya': 'KQ',
  // ── Indian carriers ───────────────────────────────
  'air india': 'AI',
  'indigo': '6E',
  'indigo airlines': '6E',
  'spicejet': 'SG',
  'spice jet': 'SG',
  'vistara': 'UK',
  'air india express': 'IX',
  // ── Latin American carriers ───────────────────────
  'avianca': 'AV',
  'latam': 'LA',
  'latam airlines': 'LA',
  'aeromexico': 'AM',
  'aeroméxico': 'AM',
  'copa': 'CM',
  'copa airlines': 'CM',
  'gol': 'G3',
  'gol airlines': 'G3',
  'gol linhas': 'G3',
  // ── Israeli carriers ──────────────────────────────
  'el al': 'LY',
  'elal': 'LY',
  // ── Misspellings for top global carriers ──────────
  'delte': 'DL',
  'dleta': 'DL',
  'detla': 'DL',
  'amercan': 'AA',
  'amarican': 'AA',
  'american airline': 'AA',
  'unitd': 'UA',
  'untied airlines': 'UA',
  'emirtes': 'EK',
  'emirats': 'EK',
  'emerites': 'EK',
  'quatar': 'QR',
  'qater': 'QR',
  'quattar': 'QR',
  'singapour': 'SQ',
  'singapore airline': 'SQ',
  'cathay pasific': 'CX',
  'catay': 'CX',
  'japan airline': 'JL',
  'nippon': 'NH',
  'lufthanza': 'LH',
  'britsh airways': 'BA',
  'british ariways': 'BA',
};

// ── Simple Levenshtein distance ──────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) dp[i][j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j]);
    }
  }
  return dp[m][n];
}

/**
 * Resolve an airline name or IATA code to an IATA code.
 * Returns null if unrecognized.
 */
export function resolveAirline(input) {
  if (!input) return null;
  const raw = input.trim();
  const upper = raw.toUpperCase().replace(/\s+/g, '');
  const lower = raw.toLowerCase().trim();

  // Direct IATA code match (2-3 chars)
  if (/^[A-Z0-9]{2,3}$/.test(upper) && CARRIERS[upper]) return upper;
  // Handle codes entered with space (e.g. "5 T")
  if (upper.length <= 3 && CARRIERS[upper.replace(/\s/g, '')]) return upper.replace(/\s/g, '');

  // Exact name match
  if (NAME_TO_IATA[lower]) return NAME_TO_IATA[lower];

  // Partial name match (substring)
  for (const [key, code] of Object.entries(NAME_TO_IATA)) {
    if (lower.includes(key) || key.includes(lower)) return code;
  }

  // Fuzzy match: Levenshtein distance <= 2 against known names (min input length 4)
  if (lower.length >= 4) {
    let best = null, bestDist = Infinity;
    for (const [key, code] of Object.entries(NAME_TO_IATA)) {
      if (Math.abs(key.length - lower.length) > 4) continue; // quick filter
      const dist = levenshtein(lower, key);
      if (dist < bestDist) { bestDist = dist; best = code; }
    }
    const threshold = lower.length <= 8 ? 2 : 3;
    if (bestDist <= threshold) return best;
  }

  return null;
}

/**
 * Get the region for a carrier IATA code.
 * Returns null if unknown.
 */
export function getCarrierRegion(iataCode) {
  if (!iataCode) return null;
  return CARRIERS[iataCode.toUpperCase()]?.region ?? null;
}

/**
 * Returns true if the carrier is a large Canadian airline for APPR tier purposes.
 */
export function isLargeCanadianCarrier(iataCode) {
  if (!iataCode) return false;
  return LARGE_CANADIAN_CARRIERS.has(iataCode.toUpperCase());
}
