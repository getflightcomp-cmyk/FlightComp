/* ══════════════════════════════════════════════════════
   Airline claims contact lookup
   Key: IATA 2-letter carrier code (first 2 chars of flight number)
   Used by: generate-letter API route, success page
══════════════════════════════════════════════════════ */

export const AIRLINE_INFO = {
  // UK carriers
  BA: { name: 'British Airways',        claimsEmail: 'customer.relations@ba.com',       claimsUrl: 'https://www.britishairways.com/en-gb/information/legal/eu-261-claim' },
  VS: { name: 'Virgin Atlantic',        claimsEmail: 'customer.relations@fly.virgin.com', claimsUrl: 'https://help.virginatlantic.com/eu261' },
  EZ: { name: 'easyJet',               claimsEmail: 'claims@easyjet.com',               claimsUrl: 'https://www.easyjet.com/en/help/compensation' },
  FR: { name: 'Ryanair',               claimsEmail: null,                                claimsUrl: 'https://www.ryanair.com/gb/en/useful-info/help-centre/claims-eu261' },
  LS: { name: 'Jet2',                  claimsEmail: 'customercare@jet2.com',             claimsUrl: 'https://www.jet2.com/help/customer-care' },
  BY: { name: 'TUI Airways',           claimsEmail: 'customerrelations@tui.co.uk',       claimsUrl: 'https://www.tui.co.uk/help-hub' },
  MT: { name: 'Thomas Cook Airlines',  claimsEmail: 'customerrelations@flythomascook.com', claimsUrl: null },
  // EU carriers
  AF: { name: 'Air France',            claimsEmail: 'customer.relations@airfrance.fr',   claimsUrl: 'https://wwws.airfrance.fr/en/compensation-claim' },
  KL: { name: 'KLM',                   claimsEmail: 'customercare@klm.com',              claimsUrl: 'https://www.klm.com/travel/en_gb/customer_support/claim' },
  LH: { name: 'Lufthansa',             claimsEmail: 'customer.relations@lufthansa.com',  claimsUrl: 'https://www.lufthansa.com/eu/en/compensation-claim' },
  IB: { name: 'Iberia',                claimsEmail: 'clienteiberia@iberia.es',           claimsUrl: 'https://www.iberia.com/en/atention-al-cliente/claims' },
  VY: { name: 'Vueling',              claimsEmail: 'eu261@vueling.com',                 claimsUrl: 'https://www.vueling.com/en/help/compensation' },
  AZ: { name: 'ITA Airways',           claimsEmail: 'ccare@itaairways.com',              claimsUrl: 'https://www.itaairways.com/en/legal-information' },
  SN: { name: 'Brussels Airlines',     claimsEmail: 'customer.relations@brusselsairlines.com', claimsUrl: 'https://www.brusselsairlines.com/en-gb/practical-information/eu-regulation.aspx' },
  SK: { name: 'SAS',                   claimsEmail: 'sasservice@sas.se',                claimsUrl: 'https://www.flysas.com/en/help/claims' },
  AY: { name: 'Finnair',              claimsEmail: 'customer.relations@finnair.com',    claimsUrl: 'https://www.finnair.com/gb/en/faq/compensation' },
  TP: { name: 'TAP Air Portugal',      claimsEmail: 'claims@tap.pt',                    claimsUrl: 'https://www.flytap.com/en-gb/help/compensation' },
  OS: { name: 'Austrian Airlines',     claimsEmail: 'customer.relations@aua.com',       claimsUrl: 'https://www.austrian.com/gb/en/compensation' },
  LO: { name: 'LOT Polish Airlines',   claimsEmail: 'obslugazwrotow@lot.com',           claimsUrl: 'https://www.lot.com/en/compensation' },
  W6: { name: 'Wizz Air',             claimsEmail: 'customerrelations@wizzair.com',     claimsUrl: 'https://wizzair.com/en-gb/information-and-services/customer-care/compensation' },
  U2: { name: 'easyJet Europe',        claimsEmail: 'claims@easyjet.com',               claimsUrl: 'https://www.easyjet.com/en/help/compensation' },
  // Other common carriers
  EK: { name: 'Emirates',             claimsEmail: 'customer.affairs@emirates.com',     claimsUrl: 'https://www.emirates.com/uk/english/help/feedback' },
  QR: { name: 'Qatar Airways',        claimsEmail: 'ccare@qatarairways.com.qa',         claimsUrl: 'https://www.qatarairways.com/en/help' },
  TK: { name: 'Turkish Airlines',     claimsEmail: 'ccare@thy.com',                    claimsUrl: 'https://www.turkishairlines.com/en-gb/any-questions' },
  AA: { name: 'American Airlines',    claimsEmail: 'customer.relations@aa.com',         claimsUrl: 'https://www.aa.com/contact/forms' },
  UA: { name: 'United Airlines',      claimsEmail: 'united@united.com',                claimsUrl: 'https://www.united.com/en/gb/fly/contact.html' },
  DL: { name: 'Delta Air Lines',      claimsEmail: 'customer.care@delta.com',           claimsUrl: 'https://www.delta.com/gb/en/need-help/overview' },
};

// National Enforcement Bodies — who to complain to if the airline rejects your claim
// Key: departure country code (ISO 3166-1 alpha-2)
export const NEB_BY_COUNTRY = {
  GB: { name: 'Civil Aviation Authority (CAA)',           url: 'https://www.caa.co.uk/passengers/resolving-travel-problems/delays-and-cancellations/options/complain-to-the-caa/', email: 'passenger.complaints@caa.co.uk' },
  FR: { name: 'Direction Générale de l\'Aviation Civile (DGAC)', url: 'https://www.ecologie.gouv.fr/dgac',             email: 'dta.secretariat@aviation-civile.gouv.fr' },
  DE: { name: 'Luftfahrt-Bundesamt (LBA)',                url: 'https://www.lba.de/DE/Buerger/Verbraucherinformationen/EU261/EU261_node.html', email: 'eu261@lba.de' },
  NL: { name: 'Inspectie Leefomgeving en Transport (ILT)',url: 'https://www.ilent.nl',                              email: 'info@ilent.nl' },
  ES: { name: 'Agencia Estatal de Seguridad Aérea (AESA)',url: 'https://www.seguridadaerea.gob.es',                email: 'atencionciudadano@seguridadaerea.es' },
  IT: { name: 'Ente Nazionale per l\'Aviazione Civile (ENAC)', url: 'https://www.enac.gov.it',                       email: 'utp@enac.gov.it' },
  BE: { name: 'Directorate-General Air Transport (DGTA)', url: 'https://mobilit.belgium.be',                       email: 'aviation@mobilit.fgov.be' },
  PT: { name: 'Autoridade Nacional da Aviação Civil (ANAC)', url: 'https://www.anac.pt',                            email: 'consumidor@anac.pt' },
  IE: { name: 'Commission for Aviation Regulation (CAR)', url: 'https://www.aviationreg.ie',                       email: 'info@aviationreg.ie' },
  DK: { name: 'Danish Transport Authority',               url: 'https://www.trafikstyrelsen.dk',                   email: 'info@trafikstyrelsen.dk' },
  SE: { name: 'Swedish Transport Agency',                 url: 'https://www.transportstyrelsen.se',                email: 'luftfart@transportstyrelsen.se' },
  FI: { name: 'Finnish Transport and Communications Agency (Traficom)', url: 'https://www.traficom.fi',            email: 'kirjaamo@traficom.fi' },
  NO: { name: 'Civil Aviation Authority Norway (Luftfartstilsynet)', url: 'https://luftfartstilsynet.no',           email: 'postmottak@caa.no' },
  PL: { name: 'Urząd Lotnictwa Cywilnego (ULC)',          url: 'https://www.ulc.gov.pl',                           email: 'kancelaria@ulc.gov.pl' },
  AT: { name: 'Agentur für Passagier- und Fahrgastrechte (apf)', url: 'https://www.apf.gv.at',                    email: 'kontakt@apf.gv.at' },
  GR: { name: 'Hellenic Civil Aviation Authority (HCAA)', url: 'https://www.hcaa.gr',                             email: 'hcaa@hcaa.gr' },
  CZ: { name: 'Civil Aviation Authority (CAA CZ)',        url: 'https://www.caa.cz',                               email: 'posta@caa.cz' },
  HU: { name: 'Hungarian Aviation Authority',             url: 'https://www.nkh.gov.hu',                           email: 'nkh@nkh.gov.hu' },
  RO: { name: 'Romanian Civil Aeronautical Authority (RCAA)', url: 'https://www.caa.ro',                           email: 'contact@caa.ro' },
  HR: { name: 'Croatian Civil Aviation Agency',           url: 'https://www.ccaa.hr',                              email: 'ccaa@ccaa.hr' },
};

/**
 * Get airline info from a flight number string (e.g. "BA123", "EK 007")
 * Returns null if airline not found.
 */
export function getAirlineInfo(flightNumber) {
  if (!flightNumber) return null;
  const code = flightNumber.trim().toUpperCase().replace(/\s+/g, '').slice(0, 2);
  return AIRLINE_INFO[code] || null;
}

/**
 * Get NEB from a departure airport info object { country } or country code string.
 */
export function getNEB(depInfoOrCountryCode) {
  if (!depInfoOrCountryCode) return null;
  // If it's an airport info object, extract country code from the country name
  if (typeof depInfoOrCountryCode === 'object') {
    const country = depInfoOrCountryCode.country;
    // Map country names to ISO codes
    const NAME_TO_CODE = {
      'UK': 'GB', 'France': 'FR', 'Germany': 'DE', 'Netherlands': 'NL',
      'Spain': 'ES', 'Italy': 'IT', 'Belgium': 'BE', 'Portugal': 'PT',
      'Ireland': 'IE', 'Denmark': 'DK', 'Sweden': 'SE', 'Finland': 'FI',
      'Norway': 'NO', 'Poland': 'PL', 'Austria': 'AT', 'Greece': 'GR',
      'Czech Rep.': 'CZ', 'Hungary': 'HU', 'Romania': 'RO', 'Croatia': 'HR',
    };
    const code = NAME_TO_CODE[country] || country;
    return NEB_BY_COUNTRY[code] || null;
  }
  return NEB_BY_COUNTRY[depInfoOrCountryCode] || null;
}
