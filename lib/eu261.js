/* ════════════════════════════════════════════════════
   EU 261/2004 & UK 261 & Canada APPR & Turkey SHY
   Decision Engine — all eligibility logic client-side.
════════════════════════════════════════════════════ */

// ── Airport / City Database ──────────────────────────
// region: 'EU' | 'EEA' | 'UK' | 'CA' | 'TR' | 'OTHER'
const AIRPORTS = {
  // UK
  LHR: { city:'London',       country:'UK', region:'UK', coords:[51.477,-0.461] },
  LGW: { city:'London',       country:'UK', region:'UK', coords:[51.148,-0.190] },
  STN: { city:'London',       country:'UK', region:'UK', coords:[51.885, 0.235] },
  LTN: { city:'London',       country:'UK', region:'UK', coords:[51.875,-0.368] },
  LCY: { city:'London',       country:'UK', region:'UK', coords:[51.505, 0.055] },
  MAN: { city:'Manchester',   country:'UK', region:'UK', coords:[53.354,-2.274] },
  EDI: { city:'Edinburgh',    country:'UK', region:'UK', coords:[55.950,-3.373] },
  GLA: { city:'Glasgow',      country:'UK', region:'UK', coords:[55.872,-4.433] },
  BHX: { city:'Birmingham',   country:'UK', region:'UK', coords:[52.453,-1.748] },
  BRS: { city:'Bristol',      country:'UK', region:'UK', coords:[51.383,-2.719] },
  NCL: { city:'Newcastle',    country:'UK', region:'UK', coords:[54.947,-1.692] },
  BFS: { city:'Belfast',      country:'UK', region:'UK', coords:[54.657,-6.216] },
  // EU
  CDG: { city:'Paris',        country:'France',      region:'EU', coords:[49.009, 2.548] },
  ORY: { city:'Paris',        country:'France',      region:'EU', coords:[48.726, 2.365] },
  AMS: { city:'Amsterdam',    country:'Netherlands', region:'EU', coords:[52.308, 4.764] },
  FRA: { city:'Frankfurt',    country:'Germany',     region:'EU', coords:[50.033, 8.571] },
  MUC: { city:'Munich',       country:'Germany',     region:'EU', coords:[48.354,11.786] },
  BER: { city:'Berlin',       country:'Germany',     region:'EU', coords:[52.366,13.503] },
  TXL: { city:'Berlin',       country:'Germany',     region:'EU', coords:[52.560,13.288] },
  MAD: { city:'Madrid',       country:'Spain',       region:'EU', coords:[40.472,-3.561] },
  BCN: { city:'Barcelona',    country:'Spain',       region:'EU', coords:[41.297, 2.078] },
  FCO: { city:'Rome',         country:'Italy',       region:'EU', coords:[41.800,12.239] },
  MXP: { city:'Milan',        country:'Italy',       region:'EU', coords:[45.630, 8.728] },
  LIN: { city:'Milan',        country:'Italy',       region:'EU', coords:[45.445, 9.277] },
  BRU: { city:'Brussels',     country:'Belgium',     region:'EU', coords:[50.902, 4.484] },
  CPH: { city:'Copenhagen',   country:'Denmark',     region:'EU', coords:[55.618,12.656] },
  ARN: { city:'Stockholm',    country:'Sweden',      region:'EU', coords:[59.651,17.919] },
  HEL: { city:'Helsinki',     country:'Finland',     region:'EU', coords:[60.317,24.963] },
  LIS: { city:'Lisbon',       country:'Portugal',    region:'EU', coords:[38.774,-9.134] },
  OPO: { city:'Porto',        country:'Portugal',    region:'EU', coords:[41.248,-8.681] },
  ATH: { city:'Athens',       country:'Greece',      region:'EU', coords:[37.936,23.944] },
  VIE: { city:'Vienna',       country:'Austria',     region:'EU', coords:[48.110,16.570] },
  WAW: { city:'Warsaw',       country:'Poland',      region:'EU', coords:[52.166,20.967] },
  KRK: { city:'Krakow',       country:'Poland',      region:'EU', coords:[50.078,19.785] },
  DUB: { city:'Dublin',       country:'Ireland',     region:'EU', coords:[53.421,-6.270] },
  BUD: { city:'Budapest',     country:'Hungary',     region:'EU', coords:[47.437,19.261] },
  PRG: { city:'Prague',       country:'Czech Rep.',  region:'EU', coords:[50.101,14.260] },
  BUC: { city:'Bucharest',    country:'Romania',     region:'EU', coords:[44.572,26.102] },
  OTP: { city:'Bucharest',    country:'Romania',     region:'EU', coords:[44.572,26.102] },
  SOF: { city:'Sofia',        country:'Bulgaria',    region:'EU', coords:[42.695,23.406] },
  ZAG: { city:'Zagreb',       country:'Croatia',     region:'EU', coords:[45.742,16.069] },
  LJU: { city:'Ljubljana',    country:'Slovenia',    region:'EU', coords:[46.223,14.458] },
  BTS: { city:'Bratislava',   country:'Slovakia',    region:'EU', coords:[48.170,17.213] },
  RIX: { city:'Riga',         country:'Latvia',      region:'EU', coords:[56.924,23.971] },
  VNO: { city:'Vilnius',      country:'Lithuania',   region:'EU', coords:[54.634,25.285] },
  TLL: { city:'Tallinn',      country:'Estonia',     region:'EU', coords:[59.413,24.833] },
  LUX: { city:'Luxembourg',   country:'Luxembourg',  region:'EU', coords:[49.634, 6.211] },
  MLA: { city:'Malta',        country:'Malta',       region:'EU', coords:[35.857,14.477] },
  NIC: { city:'Nicosia',      country:'Cyprus',      region:'EU', coords:[35.151,33.276] },
  LCA: { city:'Larnaca',      country:'Cyprus',      region:'EU', coords:[34.875,33.625] },
  // EEA (non-EU, EU261 still applies)
  OSL: { city:'Oslo',         country:'Norway',      region:'EEA', coords:[60.194,11.100] },
  BGO: { city:'Bergen',       country:'Norway',      region:'EEA', coords:[60.294, 5.218] },
  KEF: { city:'Reykjavik',    country:'Iceland',     region:'EEA', coords:[63.985,-22.606] },
  ZRH: { city:'Zurich',       country:'Switzerland', region:'OTHER', coords:[47.458, 8.548] },
  GVA: { city:'Geneva',       country:'Switzerland', region:'OTHER', coords:[46.238, 6.109] },
  // North America
  JFK: { city:'New York',     country:'USA', region:'OTHER', coords:[40.640,-73.779] },
  EWR: { city:'New York',     country:'USA', region:'OTHER', coords:[40.693,-74.169] },
  LAX: { city:'Los Angeles',  country:'USA', region:'OTHER', coords:[33.943,-118.408] },
  ORD: { city:'Chicago',      country:'USA', region:'OTHER', coords:[41.974,-87.908] },
  MIA: { city:'Miami',        country:'USA', region:'OTHER', coords:[25.796,-80.287] },
  BOS: { city:'Boston',       country:'USA', region:'OTHER', coords:[42.366,-71.010] },
  YYZ: { city:'Toronto',      country:'Canada', region:'CA', coords:[43.677,-79.631] },
  YUL: { city:'Montreal',     country:'Canada', region:'CA', coords:[45.458,-73.750] },
  YVR: { city:'Vancouver',    country:'Canada', region:'CA', coords:[49.195,-123.184] },
  YYC: { city:'Calgary',      country:'Canada', region:'CA', coords:[51.114,-114.020] },
  YEG: { city:'Edmonton',     country:'Canada', region:'CA', coords:[53.309,-113.580] },
  YOW: { city:'Ottawa',       country:'Canada', region:'CA', coords:[45.323,-75.669] },
  YHZ: { city:'Halifax',      country:'Canada', region:'CA', coords:[44.881,-63.509] },
  YWG: { city:'Winnipeg',     country:'Canada', region:'CA', coords:[49.910,-97.240] },
  YQB: { city:'Quebec City',  country:'Canada', region:'CA', coords:[46.791,-71.393] },
  MEX: { city:'Mexico City',  country:'Mexico', region:'OTHER', coords:[19.436,-99.072] },
  // Turkey
  IST: { city:'Istanbul',    country:'Turkey', region:'TR', coords:[41.275, 28.752] },
  SAW: { city:'Istanbul',    country:'Turkey', region:'TR', coords:[40.898, 29.309] },
  ESB: { city:'Ankara',      country:'Turkey', region:'TR', coords:[40.128, 32.995] },
  AYT: { city:'Antalya',     country:'Turkey', region:'TR', coords:[36.898, 30.800] },
  ADB: { city:'Izmir',       country:'Turkey', region:'TR', coords:[38.292, 27.157] },
  DLM: { city:'Dalaman',     country:'Turkey', region:'TR', coords:[36.713, 28.792] },
  BJV: { city:'Bodrum',      country:'Turkey', region:'TR', coords:[37.250, 27.664] },
  TZX: { city:'Trabzon',     country:'Turkey', region:'TR', coords:[40.995, 39.789] },
  GZT: { city:'Gaziantep',   country:'Turkey', region:'TR', coords:[36.947, 37.479] },
  ADA: { city:'Adana',       country:'Turkey', region:'TR', coords:[36.982, 35.280] },
  // Middle East
  DXB: { city:'Dubai',        country:'UAE',    region:'OTHER', coords:[25.253,55.365] },
  AUH: { city:'Abu Dhabi',    country:'UAE',    region:'OTHER', coords:[24.433,54.651] },
  DOH: { city:'Doha',         country:'Qatar',  region:'OTHER', coords:[25.273,51.608] },
  TLV: { city:'Tel Aviv',     country:'Israel', region:'OTHER', coords:[32.011,34.887] },
  // Asia
  SIN: { city:'Singapore',    country:'Singapore', region:'OTHER', coords:[ 1.350,103.994] },
  BKK: { city:'Bangkok',      country:'Thailand',  region:'OTHER', coords:[13.681,100.747] },
  HKG: { city:'Hong Kong',    country:'China',     region:'OTHER', coords:[22.308,113.918] },
  NRT: { city:'Tokyo',        country:'Japan',     region:'OTHER', coords:[35.765,140.386] },
  HND: { city:'Tokyo',        country:'Japan',     region:'OTHER', coords:[35.553,139.781] },
  ICN: { city:'Seoul',        country:'Korea',     region:'OTHER', coords:[37.460,126.441] },
  PEK: { city:'Beijing',      country:'China',     region:'OTHER', coords:[40.080,116.584] },
  PVG: { city:'Shanghai',     country:'China',     region:'OTHER', coords:[31.143,121.805] },
  DEL: { city:'Delhi',        country:'India',     region:'OTHER', coords:[28.556,77.100] },
  BOM: { city:'Mumbai',       country:'India',     region:'OTHER', coords:[19.089,72.868] },
  CMB: { city:'Colombo',      country:'Sri Lanka', region:'OTHER', coords:[ 7.180,79.884] },
  // Africa
  JNB: { city:'Johannesburg', country:'S.Africa', region:'OTHER', coords:[-26.134,28.242] },
  NBO: { city:'Nairobi',      country:'Kenya',    region:'OTHER', coords:[-1.319,36.925] },
  ADD: { city:'Addis Ababa',  country:'Ethiopia', region:'OTHER', coords:[ 8.979,38.799] },
  CMN: { city:'Casablanca',   country:'Morocco',  region:'OTHER', coords:[33.367,-7.590] },
  CAI: { city:'Cairo',        country:'Egypt',    region:'OTHER', coords:[30.122,31.406] },
  // Oceania
  SYD: { city:'Sydney',       country:'Australia', region:'OTHER', coords:[-33.947,151.179] },
  MEL: { city:'Melbourne',    country:'Australia', region:'OTHER', coords:[-37.673,144.843] },
  // South America
  GRU: { city:'São Paulo',    country:'Brazil', region:'OTHER', coords:[-23.432,-46.469] },
  EZE: { city:'Buenos Aires', country:'Argentina', region:'OTHER', coords:[-34.822,-58.536] },
  BOG: { city:'Bogotá',       country:'Colombia',  region:'OTHER', coords:[ 4.702,-74.147] },
  // Caribbean
  CUN: { city:'Cancun',       country:'Mexico', region:'OTHER', coords:[21.036,-86.877] },
  MBJ: { city:'Montego Bay',  country:'Jamaica', region:'OTHER', coords:[18.504,-77.913] },
};

// City name → primary IATA code
const CITY_TO_IATA = {
  'london':['LHR','LGW'],'london heathrow':'LHR','london gatwick':'LGW',
  'london stansted':'STN','london luton':'LTN','london city':'LCY',
  'manchester':'MAN','edinburgh':'EDI','glasgow':'GLA','birmingham':'BHX',
  'bristol':'BRS','newcastle':'NCL','belfast':'BFS',
  'paris':'CDG','paris cdg':'CDG','paris orly':'ORY',
  'amsterdam':'AMS','frankfurt':'FRA','munich':'MUC','berlin':'BER',
  'madrid':'MAD','barcelona':'BCN','rome':'FCO','milan':'MXP',
  'brussels':'BRU','copenhagen':'CPH','stockholm':'ARN','helsinki':'HEL',
  'lisbon':'LIS','porto':'OPO','athens':'ATH','vienna':'VIE',
  'warsaw':'WAW','krakow':'KRK','dublin':'DUB','budapest':'BUD',
  'prague':'PRG','bucharest':'OTP','sofia':'SOF','zagreb':'ZAG',
  'riga':'RIX','vilnius':'VNO','tallinn':'TLL','luxembourg':'LUX',
  'malta':'MLA','nicosia':'NIC','larnaca':'LCA',
  'oslo':'OSL','bergen':'BGO','reykjavik':'KEF',
  'zurich':'ZRH','geneva':'GVA',
  'new york':'JFK','new york jfk':'JFK','new york ewr':'EWR',
  'los angeles':'LAX','chicago':'ORD','miami':'MIA','boston':'BOS',
  'toronto':'YYZ','montreal':'YUL','vancouver':'YVR',
  'calgary':'YYC','edmonton':'YEG','ottawa':'YOW',
  'halifax':'YHZ','winnipeg':'YWG','quebec city':'YQB','quebec':'YQB',
  'mexico city':'MEX','cancun':'CUN',
  'dubai':'DXB','abu dhabi':'AUH','doha':'DOH','tel aviv':'TLV',
  'singapore':'SIN','bangkok':'BKK','hong kong':'HKG',
  'tokyo':'NRT','narita':'NRT','haneda':'HND',
  'seoul':'ICN','beijing':'PEK','shanghai':'PVG',
  'delhi':'DEL','mumbai':'BOM','colombo':'CMB',
  'johannesburg':'JNB','nairobi':'NBO','addis ababa':'ADD',
  'casablanca':'CMN','cairo':'CAI',
  'sydney':'SYD','melbourne':'MEL',
  'sao paulo':'GRU','buenos aires':'EZE','bogota':'BOG',
  'montego bay':'MBJ',
  'istanbul':'IST','istanbul sabiha':'SAW','sabiha gokcen':'SAW',
  'ankara':'ESB','antalya':'AYT','izmir':'ADB',
  'dalaman':'DLM','bodrum':'BJV','trabzon':'TZX',
  'gaziantep':'GZT','adana':'ADA',
  // ── Common misspellings / alternate names ────────────
  'istambul':'IST','istanbull':'IST','instanbul':'IST',
  'londra':'LHR',                       // Italian/Turkish for London
  'londон':'LHR',                       // Cyrillic lookalike
  'frankfort':'FRA','franckfurt':'FRA','frankfurth':'FRA','frankfurt am main':'FRA',
  'munchen':'MUC','münchen':'MUC',      // German umlaut variant
  'wien':'VIE',                         // German for Vienna
  'bruxelles':'BRU','brussel':'BRU',    // French/Dutch for Brussels
  'roma':'FCO','rome fco':'FCO',
  'milaan':'MXP',                       // Dutch for Milan
  'kopenhagen':'CPH','kopenhague':'CPH',
  'stockolm':'ARN','stokholm':'ARN',
  'lisbonne':'LIS',                     // French for Lisbon
  'varsovie':'WAW','warsaw':'WAW',
  'praga':'PRG',                        // Spanish/Italian for Prague
  'atenas':'ATH','athenes':'ATH',
  'bucareste':'OTP',
  'bucarest':'OTP',
  'new york city':'JFK','nyc':'JFK',
  'los angeles lax':'LAX',
  'toronto pearson':'YYZ',
  'montreal trudeau':'YUL',
  'vancouver intl':'YVR',
};

// ── Helpers ──────────────────────────────────────────

function haversine([lat1,lon1],[lat2,lon2]) {
  const R = 6371, r = Math.PI/180;
  const dLat = (lat2-lat1)*r, dLon = (lon2-lon1)*r;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function resolveLocation(input) {
  if (!input) return null;
  const raw = input.trim();
  const upper = raw.toUpperCase().replace(/\s/g,'');
  const lower = raw.toLowerCase();

  if (/^[A-Z]{3}$/.test(upper) && AIRPORTS[upper]) return AIRPORTS[upper];

  const cityKey = lower;
  if (CITY_TO_IATA[cityKey]) {
    const iata = Array.isArray(CITY_TO_IATA[cityKey])
      ? CITY_TO_IATA[cityKey][0]
      : CITY_TO_IATA[cityKey];
    return AIRPORTS[iata] || null;
  }

  for (const [key, iata] of Object.entries(CITY_TO_IATA)) {
    if (key.includes(lower) || lower.includes(key)) {
      const code = Array.isArray(iata) ? iata[0] : iata;
      return AIRPORTS[code] || null;
    }
  }

  return null;
}

function isCoveredRegion(region) {
  return region === 'EU' || region === 'EEA' || region === 'UK';
}

function getRegulation(depInfo) {
  if (!depInfo) return 'EU261';
  return depInfo.region === 'UK' ? 'UK261' : 'EU261';
}

function getCompensation(distanceKm, regulation) {
  const tiers = regulation === 'UK261'
    ? { short:'£220', medium:'£350', long:'£520' }
    : { short:'€250', medium:'€400', long:'€600' };
  if (distanceKm === null) return null;
  if (distanceKm <= 1500) return { amount: tiers.short, tier:'short', km: distanceKm };
  if (distanceKm <= 3500) return { amount: tiers.medium, tier:'medium', km: distanceKm };
  return { amount: tiers.long, tier:'long', km: distanceKm };
}

function getClaimValidity(flightDate, regulation) {
  if (!flightDate) return { expired: false, yearsAgo: null };
  const flightMs = new Date(flightDate).getTime();
  const nowMs    = Date.now();
  const yearsAgo = (nowMs - flightMs) / (1000*60*60*24*365.25);
  const limit    = regulation === 'UK261' ? 6 : (regulation === 'SHY' || regulation === 'APPR') ? 1 : 3;
  return { expired: yearsAgo > limit, yearsAgo, limit };
}

function getCareRights(distanceKm, delayLength, isCancel, isCovered) {
  if (!isCovered) return [];
  const effectiveDelay = isCancel ? 99 : delayLengthToHours(delayLength);
  const careThreshold  = distanceKm && distanceKm <= 1500 ? 2 : 3;
  const rights = [];
  if (effectiveDelay >= careThreshold || isCancel) {
    rights.push({ emoji:'🍽️', title:'Meals & refreshments', detail:'Proportional to your waiting time. Ask for vouchers at the airport desk right now.' });
    rights.push({ emoji:'📞', title:'Two free communications', detail:'Phone calls, emails, or faxes to inform family or colleagues.' });
  }
  if (effectiveDelay >= 6 || isCancel) {
    rights.push({ emoji:'🏨', title:'Hotel accommodation', detail:'If an overnight stay is required, the airline must arrange and pay for it.' });
    rights.push({ emoji:'🚌', title:'Airport–hotel transport', detail:'Return transfers between the hotel and airport at no cost to you.' });
  }
  if (effectiveDelay >= 5 || isCancel) {
    rights.push({ emoji:'↩️', title:'Full refund OR rebooking', detail:'Choose a full refund of your ticket, or rebooking on the next available flight at no extra charge.' });
  }
  return rights;
}

function delayLengthToHours(delayLength) {
  switch (delayLength) {
    case 'under2': return 1;
    case '2to3':   return 2.5;
    case '3to4':   return 3.5;
    case '4plus':  return 5;
    default:       return 0;
  }
}

function getDeskScript({ verdict, regulation, compensation, disruption, reason, depInfo, arrInfo }) {
  const reg     = regulation === 'UK261' ? 'UK261/2004' : 'EU 261/2004';
  const compStr = compensation?.amount || 'the applicable statutory amount';
  const isExtraordinary = reason === 'weather';

  if (isExtraordinary) {
    return `"I understand you are citing extraordinary circumstances and that financial compensation may not be payable. However, under Article 9 of Regulation ${reg} I am still entitled to care and assistance. Please provide meal vouchers immediately and confirm my rebooking options in writing. I require a written statement of the disruption reason for my own records."`;
  }

  if (verdict === 'unlikely') {
    return `"Could you please confirm the reason for this disruption in writing, along with a customer reference number? I want to ensure I have documentation in case the delay worsens or circumstances change. I am aware of my rights under Regulation ${reg}."`;
  }

  if (verdict === 'possibly') {
    return `"I am invoking my rights under Regulation ${reg}. Based on this disruption I believe I am entitled to statutory compensation of ${compStr} per passenger. Please confirm your position in writing with a customer service reference number. I will escalate to the national enforcement body if this is not resolved today."`;
  }

  return `"I am formally invoking my rights under Regulation ${reg}. This flight qualifies for statutory compensation of ${compStr} per passenger. I require written acknowledgement of this claim, the reason for the disruption, and a customer reference number before I leave this desk. If you cannot authorise this now, please provide your written complaints procedure — I will be filing with the national enforcement body."`;
}

// ── Regulation detection ──────────────────────────────
// Priority order (carrier-aware):
//   1. EU/EEA dep → EU261 (any airline)
//   2. UK dep → UK261 (any airline)
//   3. TR dep → SHY (any airline)
//   4. CA dep or arr → APPR
//   5. TR arr + TR carrier → SHY
//   6. EU/EEA arr + EU carrier (non-EU/UK dep) → EU261  (Art. 3(1)(b))
//   7. UK arr + UK carrier (non-EU/UK dep) → UK261
//   8. fallback → null (not covered)
//
/**
 * Try to resolve a user-entered airport/city string to an airport info object.
 * Returns null if unrecognized. Used for UI validation.
 */
export function tryResolveAirport(input) {
  return resolveLocation(input);
}

// carrierRegion: 'EU'|'UK'|'TR'|'CA'|'OTHER'|null — pass from carrier registry
export function detectRegulation(from, to, carrierRegion) {
  const depInfo = resolveLocation(from);
  const arrInfo = resolveLocation(to);

  // Airport-based rules — highest priority
  if (depInfo?.region === 'EU' || depInfo?.region === 'EEA') return 'EU261';
  if (depInfo?.region === 'UK') {
    // EU carrier on UK→EU route: operating carrier rule (Art. 3(1)(b) logic)
    if (carrierRegion === 'EU' && (arrInfo?.region === 'EU' || arrInfo?.region === 'EEA')) return 'EU261';
    return 'UK261';
  }
  if (depInfo?.region === 'TR') return 'SHY';
  if (depInfo?.region === 'CA' || arrInfo?.region === 'CA') return 'APPR';

  // Carrier-based rules — apply when dep is non-EU/UK/TR/CA
  if (arrInfo?.region === 'TR' && carrierRegion === 'TR') return 'SHY';
  if ((arrInfo?.region === 'EU' || arrInfo?.region === 'EEA') && carrierRegion === 'EU') return 'EU261';
  if (arrInfo?.region === 'UK' && carrierRegion === 'UK') return 'UK261';

  // EU carrier operating any route (Art. 3(1)(b) — EU carrier from non-EU still covered)
  if (carrierRegion === 'EU') return 'EU261';
  if (carrierRegion === 'UK') return 'UK261';

  return null; // not covered by any supported regulation
}

// ── APPR compensation ─────────────────────────────────
function getCompensationAPPR(apprDelayTier, airlineSize) {
  const large = { under3: null, '3to6': 400, '6to9': 700, '9plus': 1000 };
  const small = { under3: null, '3to6': 125, '6to9': 250, '9plus': 500 };
  const table = airlineSize === 'small' ? small : large;
  const amt   = table[apprDelayTier];
  if (!amt) return null;
  return { amount: `CA$${amt}`, raw: amt, currency: 'CAD' };
}

function getCompensationAPPRDeniedBoarding(airlineSize) {
  const large = { tier1: 900, tier2: 1800, tier3: 2400 };
  const small = { tier1: 125, tier2: 250, tier3: 500 };
  // For denied boarding we use highest tier (9+hrs equivalent)
  const table = airlineSize === 'small' ? small : large;
  return { amount: `CA$${table.tier3}`, raw: table.tier3, currency: 'CAD' };
}

export function assessClaimAPPR(answers) {
  const { disruption, flightNumber, flightDate, from, to,
          apprDelayTier, airlineSize, apprReason } = answers;

  const depInfo = resolveLocation(from);
  const arrInfo = resolveLocation(to);

  const distanceKm = depInfo && arrInfo
    ? Math.round(haversine(depInfo.coords, arrInfo.coords))
    : null;

  const isDelayed  = disruption === 'delayed';
  const isCancel   = disruption === 'cancelled';
  const isDenied   = disruption === 'denied';

  const isControlled = apprReason === 'controlled';
  const isSafety     = apprReason === 'safety';
  const isUncontrolled = apprReason === 'uncontrolled';

  // Uncontrolled or safety reasons → no cash compensation under APPR
  const reasonBlocks = isUncontrolled || isSafety;

  let compensation = null;
  let verdict;
  let verdictNote = '';

  const validity = getClaimValidity(flightDate, 'APPR');

  if (validity.expired) {
    verdict = 'unlikely';
    verdictNote = `Your flight was ${Math.floor(validity.yearsAgo)} years ago. APPR claims must generally be filed within 1 year of the incident.`;
  } else if (reasonBlocks) {
    verdict = 'unlikely';
    if (isSafety) {
      verdictNote = 'Safety-related disruptions are exempt from APPR cash compensation, but airlines must still provide care (meals, hotel) and rebooking.';
    } else {
      verdictNote = 'Uncontrolled disruptions (weather, ATC, security) are exempt from APPR cash compensation, but care rights still apply.';
    }
  } else if (isDenied) {
    compensation = getCompensationAPPRDeniedBoarding(airlineSize === 'unknown' ? 'large' : airlineSize);
    verdict = 'likely';
  } else if (isCancel && isControlled) {
    // Cancellation within 14 days: use 9plus tier as max
    compensation = getCompensationAPPR('9plus', airlineSize === 'unknown' ? 'large' : airlineSize);
    verdict = 'likely';
  } else if (isDelayed) {
    if (!apprDelayTier || apprDelayTier === 'under3') {
      verdict = 'unlikely';
      verdictNote = 'APPR compensation requires a delay of 3+ hours. Your delay doesn\'t meet this threshold.';
    } else if (!isControlled && apprReason !== 'unknown') {
      verdict = 'unlikely';
      verdictNote = 'Only airline-controlled delays qualify for APPR cash compensation.';
    } else {
      compensation = getCompensationAPPR(apprDelayTier, airlineSize === 'unknown' ? 'large' : airlineSize);
      verdict = apprReason === 'unknown' ? 'possibly' : 'likely';
      if (apprReason === 'unknown') {
        verdictNote = 'We couldn\'t confirm the disruption reason. If the airline caused the delay (not weather or safety), you\'re entitled to compensation.';
      }
    }
  } else {
    verdict = 'possibly';
    verdictNote = 'We need more details to assess your APPR claim.';
  }

  // APPR care rights
  const careRights = [];
  if (verdict !== 'unlikely' || reasonBlocks) {
    if (isDelayed || isCancel || isDenied) {
      careRights.push({ emoji:'🍽️', title:'Meals & refreshments', detail:'For delays of 3+ hours, the airline must provide food and drink vouchers.' });
      careRights.push({ emoji:'📞', title:'Communication access', detail:'The airline must provide means of communication (phone/internet) at no cost.' });
    }
    if ((isDelayed && ['6to9','9plus'].includes(apprDelayTier)) || isCancel || isDenied) {
      careRights.push({ emoji:'🏨', title:'Hotel accommodation', detail:'If an overnight stay is required, the airline must arrange and pay for a hotel.' });
      careRights.push({ emoji:'🚌', title:'Airport–hotel transport', detail:'Return transfers between the hotel and airport at no cost.' });
    }
    careRights.push({ emoji:'↩️', title:'Rebooking or refund', detail:'You may choose a full refund or rebooking on the next available flight at no extra cost.' });
  }

  return {
    verdict,
    verdictNote,
    regulation: 'APPR',
    isCovered: true,
    compensation,
    distanceKm,
    depInfo,
    arrInfo,
    careRights,
    deskScript: `"I am invoking my rights under Canada's Air Passenger Protection Regulations (SOR/2019-150). Based on this disruption I am entitled to compensation${compensation ? ` of ${compensation.amount}` : ''}. Please provide written confirmation of this claim and a customer reference number. If unresolved, I will escalate to the Canadian Transportation Agency."`,
    claimData: {
      flightNumber,
      flightDate,
      from,
      to,
      disruption,
      apprDelayTier,
      airlineSize,
      apprReason,
      regulation: 'APPR',
      compensation,
      distanceKm,
    },
    validity,
  };
}

// ── SHY (Turkey) compensation ─────────────────────────
function getCompensationSHY(isDomestic, distanceKm) {
  if (isDomestic) return { amount: '€100 (payable in Turkish Lira)', raw: 100, currency: 'EUR', isDomestic: true };
  if (distanceKm === null) return { amount: '€250–€600 (payable in Turkish Lira)', raw: null, currency: 'EUR' };
  if (distanceKm <= 1500) return { amount: '€250 (payable in Turkish Lira)', raw: 250, currency: 'EUR' };
  if (distanceKm <= 3500) return { amount: '€400 (payable in Turkish Lira)', raw: 400, currency: 'EUR' };
  return { amount: '€600 (payable in Turkish Lira)', raw: 600, currency: 'EUR' };
}

export function assessClaimSHY(answers) {
  const { disruption, flightNumber, flightDate, from, to,
          delayLength, shyReason, shyNotified14 } = answers;

  const depInfo = resolveLocation(from);
  const arrInfo = resolveLocation(to);

  const isDomestic = depInfo?.region === 'TR' && arrInfo?.region === 'TR';
  const distanceKm = depInfo && arrInfo
    ? Math.round(haversine(depInfo.coords, arrInfo.coords))
    : null;

  // Route dep Turkey → EU: could also qualify under EU261 (better for delays)
  const alsoCoveredByEU261 = !!(arrInfo && isCoveredRegion(arrInfo.region));

  const isDelayed  = disruption === 'delayed';
  const isCancel   = disruption === 'cancelled';
  const isDenied   = disruption === 'denied';

  const isForceMajeure = shyReason === 'forcemajeure';
  const isNotified14   = shyNotified14 === 'yes';

  const validity = getClaimValidity(flightDate, 'SHY');
  const delayHours = delayLengthToHours(delayLength);

  let compensation = null;
  let verdict;
  let verdictNote = '';

  if (validity.expired) {
    verdict = 'unlikely';
    verdictNote = `Your flight was ${Math.floor(validity.yearsAgo)} year(s) ago. SHY claims must be filed within 1 year of the disruption.`;
  } else if (isDelayed) {
    // SHY does NOT provide financial compensation for delays
    verdict = 'unlikely';
    verdictNote = 'Under SHY, airlines must provide meals, refreshments, and accommodation for delays over 2 hours. However, financial compensation is not available for delays — only for cancellations and denied boarding.';
    if (alsoCoveredByEU261) {
      verdictNote += ' Your flight may also qualify under EU261, which provides compensation for delays. We\'ve selected SHY as you departed from Turkey, but consider filing under EU261 if your airline is EU-registered.';
    }
  } else if (isForceMajeure) {
    verdict = 'unlikely';
    verdictNote = 'Force majeure events (severe weather, political instability, natural disasters, security risks, airport strikes) exempt airlines from SHY financial compensation. Care rights (meals, accommodation, rebooking) still apply.';
  } else if (isCancel && isNotified14) {
    verdict = 'unlikely';
    verdictNote = 'If notified 14+ days in advance, SHY does not require financial compensation. You are entitled to a full refund or alternative routing.';
  } else if (isCancel || isDenied) {
    compensation = getCompensationSHY(isDomestic, distanceKm);
    verdict = shyReason === 'unknown' ? 'possibly' : 'likely';
    if (shyReason === 'unknown') {
      verdictNote = 'We couldn\'t confirm the disruption reason. If it was due to an airline-controlled cause (not force majeure), you\'re entitled to compensation.';
    }
  } else {
    verdict = 'possibly';
    verdictNote = 'We need more details to assess your SHY claim.';
  }

  // SHY care rights
  const careRights = [];
  if (delayHours >= 2 || isCancel || isDenied) {
    careRights.push({ emoji:'🍽️', title:'Meals & refreshments', detail:'For disruptions of 2+ hours, the airline must provide food and drink at no cost.' });
    careRights.push({ emoji:'📞', title:'Free communication', detail:'The airline must allow phone calls or emails at no cost to inform family or colleagues.' });
  }
  if (delayHours >= 5 || isCancel || isDenied) {
    careRights.push({ emoji:'🏨', title:'Hotel accommodation', detail:'If an overnight stay is required, the airline must arrange and pay for a hotel.' });
    careRights.push({ emoji:'🚌', title:'Airport–hotel transport', detail:'Return transfers between the hotel and airport at no cost.' });
    careRights.push({ emoji:'↩️', title:'Full refund OR rebooking', detail:'You may choose a full refund of your ticket or rebooking on the next available flight at no extra charge.' });
  }

  const deskScript = isDelayed
    ? `"I understand SHY does not provide financial compensation for delays. However, under the SHY Passenger Regulation (Sivil Havacılık Yönetmeliği) established under Turkish Civil Aviation Law No. 2920, I am entitled to care and assistance. Please provide meal vouchers now and confirm my rights in writing with a customer reference number."`
    : `"I am invoking my rights under the SHY Passenger Regulation (Sivil Havacılık Yönetmeliği), Turkish Civil Aviation Law No. 2920, Article 143. Based on this disruption I am entitled to compensation${compensation ? ` of ${compensation.amount}` : ''}. Please provide written acknowledgement of this claim and a customer reference number. If unresolved, I will escalate to the Turkish Directorate General of Civil Aviation (SHGM) at https://web.shgm.gov.tr."`;

  return {
    verdict,
    verdictNote,
    regulation: 'SHY',
    isCovered: true,
    isDomestic,
    alsoCoveredByEU261,
    compensation,
    distanceKm,
    depInfo,
    arrInfo,
    careRights,
    deskScript,
    shyMeta: {
      deadline: 'You have 1 year from the date of the disruption to file a claim.',
      escalation: 'If the airline does not respond or you disagree with their response, file a complaint with the Turkish Directorate General of Civil Aviation (DGCA / SHGM): https://web.shgm.gov.tr',
    },
    claimData: {
      flightNumber,
      flightDate,
      from,
      to,
      disruption,
      delayLength,
      shyReason,
      shyNotified14,
      isDomestic,
      regulation: 'SHY',
      compensation,
      distanceKm,
    },
    validity,
  };
}

// ── Main assess function ──────────────────────────────
export function assessClaim(answers) {
  const { disruption, flightNumber, flightDate, from, to, delayLength, reason, carrierRegion } = answers;

  const depInfo = resolveLocation(from);
  const arrInfo = resolveLocation(to);

  const hasEUUKCarrier = carrierRegion === 'EU' || carrierRegion === 'UK';
  const depByAirport   = depInfo ? isCoveredRegion(depInfo.region) : null;
  const depCovered     = hasEUUKCarrier ? true : depByAirport;
  const regulation     = detectRegulation(from, to, carrierRegion) ?? getRegulation(depInfo);

  const distanceKm  = depInfo && arrInfo
    ? Math.round(haversine(depInfo.coords, arrInfo.coords))
    : null;

  const compensation = getCompensation(distanceKm, regulation);

  const isCancel        = disruption === 'cancelled';
  const isDenied        = disruption === 'denied';
  const isDowngraded    = disruption === 'downgraded';
  const isDelayed       = disruption === 'delayed';
  const isExtraordinary = reason === 'weather';

  const delayHours = delayLengthToHours(delayLength);

  const delayTriggersComp      = isDelayed && delayHours >= 3;
  const cancelTriggersComp     = isCancel;
  const deniedTriggersComp     = isDenied;
  const downgradedTriggersComp = isDowngraded;
  const compTriggered = delayTriggersComp || cancelTriggersComp || deniedTriggersComp || downgradedTriggersComp;

  const isCovered = depCovered === true;
  const validity  = getClaimValidity(flightDate, regulation);

  let verdict;
  let verdictNote = '';

  if (validity.expired) {
    verdict = 'unlikely';
    verdictNote = `Your flight was ${Math.floor(validity.yearsAgo)} years ago. Claims under ${regulation} must be filed within ${validity.limit} years.`;
  } else if (depCovered === false) {
    verdict = 'unlikely';
    verdictNote = `EU261/UK261 applies to flights departing from EU/EEA/UK airports${depInfo ? ` — ${depInfo.city} (${depInfo.country}) is not covered` : ''}. If your airline is EU/UK-registered you may have a case regardless.`;
  } else if (!compTriggered) {
    verdict = 'unlikely';
    if (isDelayed && delayHours < 3) {
      verdictNote = `EU261 compensation requires a delay of 3+ hours at your final destination. A ${delayHours < 2 ? 'delay under 2' : '2–3'} hour delay doesn't meet this threshold.`;
    }
  } else if (isExtraordinary) {
    verdict = 'unlikely';
    verdictNote = 'Extraordinary circumstances (weather, ATC strikes, security incidents) exempt airlines from paying cash compensation. However, your care rights — meals, hotel, rebooking — are unaffected.';
  } else if (depCovered === null) {
    verdict = 'possibly';
    verdictNote = `We couldn't confirm your departure airport. If it's in the EU/EEA/UK, or if your airline is EU/UK-registered, you may be covered.`;
  } else {
    verdict = 'likely';
    if (!compensation) verdictNote = 'Compensation amount depends on the route distance — see the claim letter for the exact figure.';
  }

  const careRights = getCareRights(distanceKm, delayLength, isCancel, depCovered !== false);
  const deskScript = getDeskScript({ verdict, regulation, compensation, disruption, reason, depInfo, arrInfo });

  return {
    verdict,
    verdictNote,
    regulation,
    isCovered,
    compensation,
    distanceKm,
    depInfo,
    arrInfo,
    careRights,
    deskScript,
    claimData: {
      flightNumber,
      flightDate,
      from,
      to,
      disruption,
      delayLength,
      reason,
      regulation,
      compensation,
      distanceKm,
    },
    validity,
  };
}
