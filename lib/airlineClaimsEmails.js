/* ══════════════════════════════════════════════════════
   Airline Claims Email Directory
   Used by the agent loop to send claim letters directly.

   Format per entry:
     name          – Full airline name
     claimsEmail   – Official claims/customer-relations email, or null if form-only
     claimsFormUrl – URL of online claims/complaints form
     notes         – Usage notes, verification status, form-only warnings

   IMPORTANT: Do not fabricate email addresses. Entries marked
   "VERIFY" should be confirmed before use in automated sending.
══════════════════════════════════════════════════════ */

export const AIRLINE_CLAIMS_EMAILS = {

  // ── European majors ───────────────────────────────────────────────────────

  FR: {
    name: 'Ryanair',
    claimsEmail: null,
    claimsFormUrl: 'https://www.ryanair.com/gb/en/useful-info/help-centre/claims-eu261',
    notes: 'Ryanair accepts EU261 claims via online form only. No direct claims email published.',
  },
  U2: {
    name: 'easyJet',
    claimsEmail: 'claims@easyjet.com',
    claimsFormUrl: 'https://www.easyjet.com/en/help/compensation',
    notes: 'Direct claims email confirmed. Also accepts online form.',
  },
  W6: {
    name: 'Wizz Air',
    claimsEmail: 'customerrelations@wizzair.com',
    claimsFormUrl: 'https://wizzair.com/en-gb/information-and-services/customer-care/compensation',
    notes: 'VERIFY — email widely referenced but Wizz Air primarily uses online form. Confirm before bulk sending.',
  },
  VY: {
    name: 'Vueling',
    claimsEmail: 'eu261@vueling.com',
    claimsFormUrl: 'https://www.vueling.com/en/help/compensation',
    notes: 'Dedicated EU261 email address. Confirm still active before use.',
  },
  EW: {
    name: 'Eurowings',
    claimsEmail: 'customer.relations@eurowings.com',
    claimsFormUrl: 'https://www.eurowings.com/en/information/rights.html',
    notes: 'VERIFY — used for general customer relations. Confirm for compensation claims specifically.',
  },
  DY: {
    name: 'Norwegian Air Shuttle',
    claimsEmail: 'customer.relations@norwegian.com',
    claimsFormUrl: 'https://www.norwegian.com/en/help/customer-relations',
    notes: 'VERIFY — email used for customer relations broadly. Norwegian primarily uses online chat/form.',
  },
  D8: {
    name: 'Norwegian Air International',
    claimsEmail: 'customer.relations@norwegian.com',
    claimsFormUrl: 'https://www.norwegian.com/en/help/customer-relations',
    notes: 'Same contact as DY (Norwegian Air Shuttle).',
  },
  LH: {
    name: 'Lufthansa',
    claimsEmail: 'customer.relations@lufthansa.com',
    claimsFormUrl: 'https://www.lufthansa.com/eu/en/compensation-claim',
    notes: 'Confirmed customer relations email. May redirect to online form for formal EU261 claims.',
  },
  AF: {
    name: 'Air France',
    claimsEmail: 'customer.relations@airfrance.fr',
    claimsFormUrl: 'https://wwws.airfrance.fr/en/compensation-claim',
    notes: 'VERIFY — Air France often requires online form for EU261. Confirm email still accepted.',
  },
  KL: {
    name: 'KLM',
    claimsEmail: 'customercare@klm.com',
    claimsFormUrl: 'https://www.klm.com/travel/en_gb/customer_support/claim',
    notes: 'VERIFY — KLM primarily uses online claim portal. Email may not be monitored for EU261.',
  },
  BA: {
    name: 'British Airways',
    claimsEmail: 'customer.relations@ba.com',
    claimsFormUrl: 'https://www.britishairways.com/en-gb/information/legal/eu-261-claim',
    notes: 'VERIFY — BA has a dedicated EU261 online form. Email may route to generic customer relations.',
  },
  IB: {
    name: 'Iberia',
    claimsEmail: 'clienteiberia@iberia.es',
    claimsFormUrl: 'https://www.iberia.com/en/atention-al-cliente/claims',
    notes: 'VERIFY — Spanish-language email. May redirect non-Spanish claims to online form.',
  },
  TP: {
    name: 'TAP Air Portugal',
    claimsEmail: 'claims@tap.pt',
    claimsFormUrl: 'https://www.flytap.com/en-gb/help/compensation',
    notes: 'Dedicated claims email. Confirm still operational.',
  },
  SK: {
    name: 'SAS Scandinavian Airlines',
    claimsEmail: 'sasservice@sas.se',
    claimsFormUrl: 'https://www.flysas.com/en/help/claims',
    notes: 'VERIFY — SAS went through restructuring in 2023–2024; confirm current claims contact.',
  },
  AY: {
    name: 'Finnair',
    claimsEmail: 'customer.relations@finnair.com',
    claimsFormUrl: 'https://www.finnair.com/gb/en/faq/compensation',
    notes: 'VERIFY — confirm this email still accepted for EU261 claims vs online form.',
  },
  LX: {
    name: 'Swiss International Air Lines',
    claimsEmail: 'customer.relations@swiss.com',
    claimsFormUrl: 'https://www.swiss.com/gb/en/fly/legal/passenger-rights',
    notes: 'VERIFY — SWISS may route to Lufthansa Group process. Confirm before use.',
  },
  OS: {
    name: 'Austrian Airlines',
    claimsEmail: 'customer.relations@aua.com',
    claimsFormUrl: 'https://www.austrian.com/gb/en/compensation',
    notes: 'VERIFY — part of Lufthansa Group; confirm claims handling.',
  },
  SN: {
    name: 'Brussels Airlines',
    claimsEmail: 'customer.relations@brusselsairlines.com',
    claimsFormUrl: 'https://www.brusselsairlines.com/en-gb/practical-information/eu-regulation.aspx',
    notes: 'VERIFY — part of Lufthansa Group. Confirm current claims email.',
  },
  LO: {
    name: 'LOT Polish Airlines',
    claimsEmail: 'obslugazwrotow@lot.com',
    claimsFormUrl: 'https://www.lot.com/en/compensation',
    notes: 'VERIFY — Polish-language address. Confirm English claims are accepted here.',
  },
  EI: {
    name: 'Aer Lingus',
    claimsEmail: 'customerrelations@aerlingus.com',
    claimsFormUrl: 'https://www.aerlingus.com/help-centre/compensation',
    notes: 'VERIFY — Aer Lingus (IAG group) may have updated contact. Confirm before use.',
  },
  A3: {
    name: 'Aegean Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://en.aegeanair.com/travel-info/your-rights/',
    notes: 'No direct claims email found publicly. Uses online form only.',
  },
  FI: {
    name: 'Icelandair',
    claimsEmail: null,
    claimsFormUrl: 'https://www.icelandair.com/support/customer-service/',
    notes: 'No dedicated claims email found. Uses online contact form. VERIFY.',
  },
  X3: {
    name: 'TUI fly Deutschland',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tuifly.com/de/informationen/passagierrechte',
    notes: 'German TUI leisure carrier. Uses online form. VERIFY direct email.',
  },
  TB: {
    name: 'TUI fly Belgium',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tuifly.be/en/travel-info/passenger-rights',
    notes: 'Belgian TUI leisure carrier. Uses online form. VERIFY.',
  },
  ZT: {
    name: 'TUI Airways (UK)',
    claimsEmail: 'customerrelations@tui.co.uk',
    claimsFormUrl: 'https://www.tui.co.uk/help-hub',
    notes: 'VERIFY — UK TUI leisure carrier. Confirm email for UK261 claims.',
  },
  DE: {
    name: 'Condor',
    claimsEmail: null,
    claimsFormUrl: 'https://www.condor.com/eu/condor-highlights/passenger-rights.jsp',
    notes: 'No direct claims email found publicly. Uses online form. VERIFY.',
  },
  HV: {
    name: 'Transavia Netherlands',
    claimsEmail: 'customercare@transavia.com',
    claimsFormUrl: 'https://www.transavia.com/en-EU/home/claim',
    notes: 'VERIFY — confirm this email handles EU261 claims vs general customer care.',
  },
  TO: {
    name: 'Transavia France',
    claimsEmail: null,
    claimsFormUrl: 'https://www.transavia.com/fr-FR/accueil/reclamation',
    notes: 'French subsidiary of Transavia. No separate claims email found. VERIFY.',
  },
  LS: {
    name: 'Jet2',
    claimsEmail: 'customercare@jet2.com',
    claimsFormUrl: 'https://www.jet2.com/help/customer-care',
    notes: 'VERIFY — Jet2 is UK charter/leisure. Confirm for UK261 claims specifically.',
  },
  PC: {
    name: 'Pegasus Airlines',
    claimsEmail: 'iletisim@flypgs.com',
    claimsFormUrl: 'https://www.flypgs.com/en/useful-info/customer-support',
    notes: 'VERIFY — primary contact is Turkish-language. Confirm English EU261 claims route here.',
  },
  OG: {
    name: 'PLAY Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.flyplay.com/en/help',
    notes: 'Icelandic low-cost carrier. No direct claims email confirmed. Uses online form. VERIFY.',
  },
  V7: {
    name: 'Volotea',
    claimsEmail: null,
    claimsFormUrl: 'https://www.volotea.com/en/help/passenger-rights/',
    notes: 'Spanish low-cost carrier. No direct claims email found. Uses online form. VERIFY.',
  },
  BT: {
    name: 'Air Baltic',
    claimsEmail: null,
    claimsFormUrl: 'https://www.airbaltic.com/en/passenger-rights',
    notes: 'Latvian carrier. No direct claims email confirmed. Uses online form. VERIFY.',
  },
  OU: {
    name: 'Croatia Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.croatiaairlines.com/Travel-Info/Passenger-Rights',
    notes: 'No direct claims email confirmed. VERIFY.',
  },
  JU: {
    name: 'Air Serbia',
    claimsEmail: null,
    claimsFormUrl: 'https://www.airserbia.com/en/passenger-rights',
    notes: 'No direct claims email confirmed. VERIFY.',
  },
  TU: {
    name: 'Tunisair',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tunisair.com/site/upload/pdf/EN.pdf',
    notes: 'No direct claims email confirmed. VERIFY — may not be covered by EU261.',
  },
  AT: {
    name: 'Royal Air Maroc',
    claimsEmail: null,
    claimsFormUrl: 'https://www.royalairmaroc.com/us-en/Passenger-rights',
    notes: 'No direct claims email confirmed. VERIFY — EU261 coverage depends on route.',
  },
  UX: {
    name: 'Air Europa',
    claimsEmail: null,
    claimsFormUrl: 'https://www.aireuropa.com/en/flights/passenger-rights',
    notes: 'No direct claims email confirmed. VERIFY.',
  },
  AZ: {
    name: 'ITA Airways',
    claimsEmail: 'ccare@itaairways.com',
    claimsFormUrl: 'https://www.itaairways.com/en/legal-information',
    notes: 'VERIFY — ITA took over Alitalia. Confirm this email handles EU261.',
  },
  VS: {
    name: 'Virgin Atlantic',
    claimsEmail: 'customer.relations@fly.virgin.com',
    claimsFormUrl: 'https://help.virginatlantic.com/eu261',
    notes: 'VERIFY — confirm for UK261 claims specifically.',
  },

  // ── Turkish carriers ──────────────────────────────────────────────────────

  TK: {
    name: 'Turkish Airlines',
    claimsEmail: 'ccare@thy.com',
    claimsFormUrl: 'https://www.turkishairlines.com/en-gb/any-questions/compensation-request',
    notes: 'VERIFY — general customer care email. Confirm for SHY/EU261 compensation claims.',
  },
  XQ: {
    name: 'SunExpress',
    claimsEmail: 'contact@sunexpress.com',
    claimsFormUrl: 'https://www.sunexpress.com/en/service',
    notes: 'VERIFY — general contact email. Confirm for compensation claims specifically.',
  },
  XC: {
    name: 'Corendon Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.corendonairlines.com/en/customer-services',
    notes: 'No direct claims email confirmed. Uses online form. VERIFY.',
  },

  // ── Canadian carriers ─────────────────────────────────────────────────────

  AC: {
    name: 'Air Canada',
    claimsEmail: null,
    claimsFormUrl: 'https://www.aircanada.com/ca/en/aco/home/plan/customer-support/appr.html',
    notes: 'Air Canada uses online form for APPR claims. No direct claims email published.',
  },
  WS: {
    name: 'WestJet',
    claimsEmail: 'appr@westjet.com',
    claimsFormUrl: 'https://www.westjet.com/en-ca/legal/air-passenger-protection-regulations',
    notes: 'Dedicated APPR email confirmed.',
  },
  PD: {
    name: 'Porter Airlines',
    claimsEmail: 'customercare@flyporter.com',
    claimsFormUrl: 'https://www.flyporter.com/en-ca/travel-information/policies/air-passenger-protection',
    notes: 'VERIFY — general customer care email. Confirm handles APPR claims.',
  },
  F8: {
    name: 'Flair Airlines',
    claimsEmail: 'guestcare@flyflair.com',
    claimsFormUrl: 'https://flyflair.com/help',
    notes: 'VERIFY — general guest care email. Confirm for APPR claims.',
  },
  WG: {
    name: 'Sunwing Airlines',
    claimsEmail: 'customerrelations@sunwing.ca',
    claimsFormUrl: 'https://www.sunwing.ca/en/support',
    notes: 'VERIFY — confirm handles APPR claims specifically.',
  },
  TS: {
    name: 'Air Transat',
    claimsEmail: 'satisfaction@transat.com',
    claimsFormUrl: 'https://www.airtransat.com/en-CA/Travel-info/Air-Passenger-Protection-Regulations',
    notes: 'VERIFY — confirm email handles APPR claims.',
  },
  WO: {
    name: 'Swoop (merged into WestJet)',
    claimsEmail: 'appr@westjet.com',
    claimsFormUrl: 'https://www.westjet.com/en-ca/legal/air-passenger-protection-regulations',
    notes: 'Swoop was merged into WestJet in 2023. Route claims to WestJet\'s APPR contact.',
  },

  // ── Gulf / connecting carriers ─────────────────────────────────────────────

  EK: {
    name: 'Emirates',
    claimsEmail: null,
    claimsFormUrl: 'https://www.emirates.com/uk/english/help/feedback/',
    notes: 'Emirates uses online feedback form. No direct claims email published. EU261 applies only on EU-departing flights.',
  },
  QR: {
    name: 'Qatar Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.qatarairways.com/en/help/submit-a-complaint.html',
    notes: 'Uses online complaint form. No direct claims email. EU261 applies on EU-departing flights.',
  },
  EY: {
    name: 'Etihad Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.etihad.com/en/help/contact-us/customer-relations',
    notes: 'No direct claims email confirmed. Uses online form. EU261 on EU-departing flights.',
  },
  SV: {
    name: 'Saudia',
    claimsEmail: null,
    claimsFormUrl: 'https://www.saudia.com/help-center/contact-us',
    notes: 'No direct claims email confirmed. VERIFY — EU261 may apply on EU-departing flights.',
  },

  // ── US carriers with EU routes ─────────────────────────────────────────────

  UA: {
    name: 'United Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.united.com/en/us/fly/help-center/customer-care.html',
    notes: 'No direct EU261 claims email published. EU261 applies on EU-departing flights operated by United.',
  },
  DL: {
    name: 'Delta Air Lines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.delta.com/us/en/need-help/overview',
    notes: 'No direct EU261 claims email published. EU261 on EU-departing flights.',
  },
  AA: {
    name: 'American Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.americanairlines.co.uk/i18n/customer-service/customer-relations/customer-relations.jsp',
    notes: 'No direct EU261 claims email. Uses online form for customer relations.',
  },
  B6: {
    name: 'JetBlue Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.jetblue.com/help',
    notes: 'No direct EU261 claims email. EU261 on EU-departing flights (Heathrow, Gatwick, Amsterdam, Paris).',
  },

};

/**
 * Get claims contact for an airline by IATA code.
 * Returns { name, claimsEmail, claimsFormUrl, notes } or null.
 */
export function getAirlineClaimsContact(iataCode) {
  if (!iataCode) return null;
  return AIRLINE_CLAIMS_EMAILS[iataCode.trim().toUpperCase()] || null;
}
