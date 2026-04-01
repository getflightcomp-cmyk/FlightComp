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
};

// Large Canadian carriers for APPR tier determination
const LARGE_CANADIAN_CARRIERS = new Set(['AC', 'WS', 'WG', 'TS', 'F8', 'PD']);

// Airline name → IATA code (lowercase keys for fuzzy matching)
const NAME_TO_IATA = {
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
  'british airways': 'BA',
  'ba': 'BA',
  'virgin atlantic': 'VS',
  'virgin': 'VS',
  'jet2': 'LS',
  'tui airways': 'ZT',
  'tui': 'ZT',
  'thomas cook': 'MT',
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
};

/**
 * Resolve an airline name or IATA code to an IATA code.
 * Returns null if unrecognized.
 */
export function resolveAirline(input) {
  if (!input) return null;
  const raw = input.trim();
  const upper = raw.toUpperCase().replace(/\s+/g, '');
  const lower = raw.toLowerCase();

  // Direct IATA code match (2-3 chars)
  if (/^[A-Z0-9]{2,3}$/.test(upper) && CARRIERS[upper]) return upper;
  // Handle codes entered with space (e.g. "5 T")
  if (upper.length <= 3 && CARRIERS[upper.replace(/\s/g, '')]) return upper.replace(/\s/g, '');

  // Exact name match
  if (NAME_TO_IATA[lower]) return NAME_TO_IATA[lower];

  // Partial name match
  for (const [key, code] of Object.entries(NAME_TO_IATA)) {
    if (lower.includes(key) || key.includes(lower)) return code;
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
