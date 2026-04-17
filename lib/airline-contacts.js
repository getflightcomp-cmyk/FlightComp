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
    claimsEmail: null,
    claimsFormUrl: 'https://www.easyjet.com/en/help/compensation',
    mailingAddress: 'easyJet UK Ltd, Hangar 89, London Luton Airport, Luton, Bedfordshire, LU2 9PF, UK',
    webFormOnly: true,
  },
  LH: {
    name: 'Lufthansa',
    claimsEmail: 'customer.relations@lufthansa.com',
    claimsFormUrl: 'https://www.lufthansa.com/eu/en/compensation-claim',
    mailingAddress: 'Lufthansa Customer Relations, Lufthansa Aviation Center, Airportring, 60546 Frankfurt am Main, Germany',
  },
  AF: {
    name: 'Air France',
    claimsEmail: null,
    claimsFormUrl: 'https://wwws.airfrance.fr/en/compensation-claim',
    mailingAddress: 'Air France Customer Relations, 45 rue de Paris, 95747 Roissy CDG Cedex, France',
    webFormOnly: true,
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
    claimsEmail: 'customerservice@brusselsairlines.com',
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
  OK: {
    name: 'Czech Airlines',
    claimsEmail: 'customer.relations@czechairlines.com',
    claimsFormUrl: 'https://www.czechairlines.com/en/information/claim',
    mailingAddress: 'Czech Airlines, Customer Relations, Jana Kašpara 1069/1, 160 08 Prague 6, Czech Republic',
  },
  RO: {
    name: 'TAROM',
    claimsEmail: 'customer.relations@tarom.ro',
    claimsFormUrl: 'https://www.tarom.ro/en/contact',
    mailingAddress: 'TAROM, Customer Relations, Calea Bucureştilor 224 F, Otopeni 075150, Romania',
  },
  JU: {
    name: 'Air Serbia',
    claimsEmail: 'customer.relations@airserbia.com',
    claimsFormUrl: 'https://www.airserbia.com/en/info/contact',
    mailingAddress: 'Air Serbia, Customer Relations, Surčin 11271, Belgrade, Serbia',
  },
  A3: {
    name: 'Aegean Airlines',
    claimsEmail: 'customercare@aegeanair.com',
    claimsFormUrl: 'https://en.aegeanair.com/travel-info/useful-info/passenger-rights',
    mailingAddress: 'Aegean Airlines, Customer Care, 31 Viltanioti Street, 14564 Kifissia, Athens, Greece',
  },
  OA: {
    name: 'Olympic Air',
    claimsEmail: 'customer.care@olympicair.com',
    claimsFormUrl: 'https://www.olympicair.com/en/contact',
    mailingAddress: 'Olympic Air, Customer Care, 31 Viltanioti Street, 14564 Kifissia, Athens, Greece',
  },
  FI: {
    name: 'Icelandair',
    claimsEmail: 'customercare@icelandair.is',
    claimsFormUrl: 'https://www.icelandair.com/support/passenger-rights',
    mailingAddress: 'Icelandair, Customer Relations, Reykjavik Airport, 101 Reykjavik, Iceland',
  },
  BT: {
    name: 'airBaltic',
    claimsEmail: 'customer.support@airbaltic.com',
    claimsFormUrl: 'https://www.airbaltic.com/en/flight-delays-and-cancellations',
    mailingAddress: 'AS airBaltic Corporation, Customer Relations, Riga International Airport, Marupe, LV-1053, Latvia',
  },
  LG: {
    name: 'Luxair',
    claimsEmail: 'customer.relations@luxair.lu',
    claimsFormUrl: 'https://www.luxair.lu/en/information/contact',
    mailingAddress: 'Luxair, Customer Relations, Aéroport de Luxembourg, L-2987 Luxembourg',
  },
  DE: {
    name: 'Condor',
    claimsEmail: 'customer.relations@condor.com',
    claimsFormUrl: 'https://www.condor.com/eu/flight/compensation.jsp',
    mailingAddress: 'Condor Flugdienst GmbH, Customer Relations, Condor Platz 1, 60549 Frankfurt am Main, Germany',
  },
  X3: {
    name: 'TUIfly Germany',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tuifly.com/de/service/fluggastrechte',
    mailingAddress: 'TUIfly GmbH, Customer Relations, Karl-Wiechert-Allee 23, 30625 Hannover, Germany',
    webFormOnly: true,
  },
  OR: {
    name: 'TUI fly Netherlands',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tui.nl/service/contact',
    mailingAddress: 'TUI fly Netherlands B.V., Piekstraat 2, 3071 EL Rotterdam, Netherlands',
    webFormOnly: true,
  },
  NT: {
    name: 'Binter Canarias',
    claimsEmail: 'atencion.cliente@bintercanarias.com',
    claimsFormUrl: 'https://www.bintercanarias.com/en/customer-service',
    mailingAddress: 'Binter Canarias, Avenida de la Industria 2, 35010 Las Palmas de Gran Canaria, Spain',
  },
  V7: {
    name: 'Volotea',
    claimsEmail: 'eu261@volotea.com',
    claimsFormUrl: 'https://www.volotea.com/en/customer-service',
    mailingAddress: 'Volotea, Customer Service, Via del Lauro 7, 20121 Milan, Italy',
  },
  VF: {
    name: 'AJet',
    claimsEmail: 'customerrelations@ajet.com',
    claimsFormUrl: 'https://www.ajet.com/en/support',
    mailingAddress: 'AJet, Customer Relations, Anadolujet Yönetim Binası, Atatürk Havalimanı, 34149 Istanbul, Turkey',
  },
  '8Q': {
    name: 'Onur Air',
    claimsEmail: 'info@onurair.com',
    claimsFormUrl: 'https://www.onurair.com/en/contact',
    mailingAddress: 'Onur Air, Customer Relations, Atatürk Havalimanı İç Hatlar Terminal, Istanbul, Turkey',
  },
  SU: {
    name: 'Aeroflot',
    claimsEmail: 'claim@aeroflot.ru',
    claimsFormUrl: 'https://www.aeroflot.ru/en/help/claims',
    mailingAddress: 'Aeroflot, Customer Relations, Arbat 27/14, Moscow 119002, Russia',
  },
  UT: {
    name: 'UTair',
    claimsEmail: null,
    claimsFormUrl: 'https://www.utair.ru/en/customer-service',
    mailingAddress: 'UTair Aviation, Customer Relations, 1 Industrialnaya St., Surgut, Tyumen Region 628408, Russia',
    webFormOnly: true,
  },
  S7: {
    name: 'S7 Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.s7.ru/en/support',
    mailingAddress: 'S7 Airlines, Customer Relations, Tolmachevo Airport, Novosibirsk 633104, Russia',
    webFormOnly: true,
  },
  QS: {
    name: 'SmartWings',
    claimsEmail: 'customer.service@smartwings.com',
    claimsFormUrl: 'https://www.smartwings.com/en/customer-service',
    mailingAddress: 'SmartWings a.s., Customer Service, K Letišti 1068/30, 160 08 Prague 6, Czech Republic',
  },
  '7W': {
    name: 'Wind Rose Aviation',
    claimsEmail: 'info@windrose.aero',
    claimsFormUrl: 'https://www.windrose.aero/en/contact',
    mailingAddress: 'Wind Rose Aviation, Customer Relations, Boryspil International Airport, Kyiv, Ukraine',
  },
  DX: {
    name: 'DAT (Danish Air Transport)',
    claimsEmail: 'info@dat.dk',
    claimsFormUrl: 'https://www.dat.dk/en/contact',
    mailingAddress: 'DAT Danish Air Transport, Billund Airport, Passagerterminalen 10, 7190 Billund, Denmark',
  },
  WF: {
    name: 'Widerøe',
    claimsEmail: 'kundesenter@wideroe.no',
    claimsFormUrl: 'https://www.wideroe.no/en/customer-service',
    mailingAddress: 'Widerøe Flyveselskap AS, Customer Service, Postboks 247, 8001 Bodø, Norway',
  },
  PS: {
    name: 'Ukraine International Airlines',
    claimsEmail: 'claims@flyuia.com',
    claimsFormUrl: 'https://www.flyuia.com/ua/en/information/claims',
    mailingAddress: 'Ukraine International Airlines, Customer Relations, 4 Lysenka Street, Kyiv 01001, Ukraine',
  },
  '5F': {
    name: 'Fly One',
    claimsEmail: 'info@flyone.eu',
    claimsFormUrl: 'https://www.flyone.eu/en/support',
    mailingAddress: 'Fly One, Customer Relations, Chișinău International Airport, MD-2026 Chișinău, Moldova',
  },
  XK: {
    name: 'Air Corsica',
    claimsEmail: 'reclamations@aircorsica.com',
    claimsFormUrl: 'https://www.aircorsica.com/en/support',
    mailingAddress: 'Air Corsica, Service Clients, Aéroport d\'Ajaccio Napoléon Bonaparte, 20090 Ajaccio, France',
  },
  TB: {
    name: 'TUI fly Belgium',
    claimsEmail: null,
    claimsFormUrl: 'https://www.tui.be/en/service/contact',
    mailingAddress: 'TUI fly Belgium NV, Customer Relations, Lozenberg 35, B-1932 Zaventem, Belgium',
    webFormOnly: true,
  },
  HG: {
    name: 'HiSky',
    claimsEmail: 'support@hisky.aero',
    claimsFormUrl: 'https://www.hisky.aero/en/support',
    mailingAddress: 'HiSky, Customer Relations, Chișinău International Airport, MD-2026 Chișinău, Moldova',
  },
  ZB: {
    name: 'Monarch Airlines',
    claimsEmail: null,
    claimsFormUrl: null,
    mailingAddress: null,
    defunct: true,
  },
  BE: {
    name: 'Flybe',
    claimsEmail: null,
    claimsFormUrl: null,
    mailingAddress: null,
    defunct: true,
  },
  // ── UK carriers ───────────────────────────────────
  BA: {
    name: 'British Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.britishairways.com/en-gb/information/legal/eu-261-claim',
    mailingAddress: 'British Airways, Customer Relations, PO Box 5619, Sudbury, CO10 2PG, UK',
    webFormOnly: true,
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
  '8P': {
    name: 'Pacific Coastal Airlines',
    claimsEmail: 'info@pacific-coastal.com',
    claimsFormUrl: 'https://www.pacific-coastal.com/contact',
    mailingAddress: 'Pacific Coastal Airlines, 4440 Cowley Crescent, Richmond, BC V7B 1B8, Canada',
  },
  Y9: {
    name: 'Lynx Air',
    claimsEmail: null,
    claimsFormUrl: null,
    mailingAddress: null,
    defunct: true,
  },
  // ── US carriers ───────────────────────────────────
  AA: {
    name: 'American Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.aa.com/contact/forms',
    mailingAddress: 'American Airlines, Customer Relations, PO Box 619612, DFW Airport, TX 75261-9612, USA',
    webFormOnly: true,
  },
  DL: {
    name: 'Delta Air Lines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.delta.com/us/en/need-help/overview',
    mailingAddress: 'Delta Air Lines, Customer Care, PO Box 20980, Atlanta, GA 30320-2980, USA',
    webFormOnly: true,
  },
  UA: {
    name: 'United Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.united.com/ual/en/us/fly/contact/customer-care.html',
    mailingAddress: 'United Airlines, Customer Care, 900 Grand Plaza Drive NHCCR, Houston, TX 77067, USA',
    webFormOnly: true,
  },
  B6: {
    name: 'JetBlue Airways',
    claimsEmail: 'customercare@jetblue.com',
    claimsFormUrl: 'https://www.jetblue.com/contact-us',
    mailingAddress: 'JetBlue Airways, Customer Relations, 27-01 Queens Plaza North, Long Island City, NY 11101, USA',
  },
  AS: {
    name: 'Alaska Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.alaskaair.com/content/about-us/comments',
    mailingAddress: 'Alaska Airlines, Customer Care, PO Box 68900, Seattle, WA 98168, USA',
    webFormOnly: true,
  },
  WN: {
    name: 'Southwest Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.southwest.com/contact-us',
    mailingAddress: 'Southwest Airlines, Customer Relations, PO Box 36647, Dallas, TX 75235-1647, USA',
    webFormOnly: true,
  },
  NK: {
    name: 'Spirit Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.spirit.com/customer-service',
    mailingAddress: 'Spirit Airlines, Customer Relations, 2800 Executive Way, Miramar, FL 33025, USA',
    webFormOnly: true,
  },
  F9: {
    name: 'Frontier Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.flyfrontier.com/customer-support',
    mailingAddress: 'Frontier Airlines, Customer Relations, 4545 Airport Way, Denver, CO 80239, USA',
    webFormOnly: true,
  },
  HA: {
    name: 'Hawaiian Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.hawaiianairlines.com/customer-support',
    mailingAddress: 'Hawaiian Airlines, Customer Relations, PO Box 30008, Honolulu, HI 96820, USA',
    webFormOnly: true,
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
  // ── Middle East carriers ──────────────────────────
  EK: {
    name: 'Emirates',
    claimsEmail: null,
    claimsFormUrl: 'https://www.emirates.com/uk/english/help/form/eu261-refund/',
    mailingAddress: 'Emirates Customer Affairs, PO Box 686, Dubai, United Arab Emirates',
    webFormOnly: true,
  },
  QR: {
    name: 'Qatar Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.qatarairways.com/en/help.html',
    mailingAddress: 'Qatar Airways, Customer Care, PO Box 22550, Doha, Qatar',
    webFormOnly: true,
  },
  EY: {
    name: 'Etihad Airways',
    claimsEmail: null,
    claimsFormUrl: 'https://www.etihad.com/en/help',
    mailingAddress: 'Etihad Airways, Customer Affairs, PO Box 35566, Abu Dhabi, UAE',
    webFormOnly: true,
  },
  SV: {
    name: 'Saudia',
    claimsEmail: 'customercare@saudia.com',
    claimsFormUrl: 'https://www.saudia.com/help-center',
    mailingAddress: 'Saudia, Customer Relations, PO Box 620, Jeddah 21231, Saudi Arabia',
  },
  GF: {
    name: 'Gulf Air',
    claimsEmail: 'customer.care@gulfair.com',
    claimsFormUrl: 'https://www.gulfair.com/help',
    mailingAddress: 'Gulf Air, Customer Care, PO Box 138, Manama, Bahrain',
  },
  WY: {
    name: 'Oman Air',
    claimsEmail: 'customerservice@omanair.com',
    claimsFormUrl: 'https://www.omanair.com/en/contact-us',
    mailingAddress: 'Oman Air, Customer Service, PO Box 58, Postal Code 111, Seeb International Airport, Muscat, Oman',
  },
  KU: {
    name: 'Kuwait Airways',
    claimsEmail: 'feedback@kuwaitairways.com',
    claimsFormUrl: 'https://www.kuwaitairways.com/en/contact-us',
    mailingAddress: 'Kuwait Airways, Customer Relations, Kuwait International Airport, Kuwait City, Kuwait',
  },
  RJ: {
    name: 'Royal Jordanian',
    claimsEmail: 'customercare@rj.com',
    claimsFormUrl: 'https://www.rj.com/en/help',
    mailingAddress: 'Royal Jordanian, Customer Care, PO Box 302, Amman 11118, Jordan',
  },
  ME: {
    name: 'Middle East Airlines',
    claimsEmail: 'customerrelations@mea.com.lb',
    claimsFormUrl: 'https://www.mea.com.lb/english/support',
    mailingAddress: 'Middle East Airlines, Customer Relations, MEA House, Beirut Rafic Hariri International Airport, Beirut, Lebanon',
  },
  LY: {
    name: 'El Al Israel Airlines',
    claimsEmail: 'customer.relations@elal.co.il',
    claimsFormUrl: 'https://www.elal.com/en/Customer-Service',
    mailingAddress: 'El Al Israel Airlines, Customer Relations, PO Box 41, Ben Gurion Airport 70100, Israel',
  },
  // ── African carriers ──────────────────────────────
  MS: {
    name: 'EgyptAir',
    claimsEmail: 'customer.care@egyptair.com',
    claimsFormUrl: 'https://www.egyptair.com/en/Pages/CustomerCare',
    mailingAddress: 'EgyptAir, Customer Care, Cairo International Airport, Cairo 11776, Egypt',
  },
  AT: {
    name: 'Royal Air Maroc',
    claimsEmail: 'reclamations@royalairmaroc.com',
    claimsFormUrl: 'https://www.royalairmaroc.com/ma-en/Contact-us',
    mailingAddress: 'Royal Air Maroc, Customer Relations, Aéroport Mohammed V, Casablanca, Morocco',
  },
  TU: {
    name: 'Tunisair',
    claimsEmail: 'info@tunisair.com.tn',
    claimsFormUrl: 'https://www.tunisair.com/en/contact',
    mailingAddress: 'Tunisair, Direction Commerciale, Boulevard du 7 Novembre, Tunis-Carthage Airport, Tunisia',
  },
  AH: {
    name: 'Air Algérie',
    claimsEmail: 'contact@airalgerie.dz',
    claimsFormUrl: 'https://www.airalgerie.dz/en',
    mailingAddress: 'Air Algérie, Direction Commerciale, 1 Place Maurice Audin, 16000 Algiers, Algeria',
  },
  ET: {
    name: 'Ethiopian Airlines',
    claimsEmail: 'customercare@ethiopianairlines.com',
    claimsFormUrl: 'https://www.ethiopianairlines.com/aa/help/contact-us',
    mailingAddress: 'Ethiopian Airlines, Customer Care, Bole International Airport, PO Box 1755, Addis Ababa, Ethiopia',
  },
  KQ: {
    name: 'Kenya Airways',
    claimsEmail: 'customercare@kenya-airways.com',
    claimsFormUrl: 'https://www.kenya-airways.com/en/contact-us',
    mailingAddress: 'Kenya Airways, Customer Care, PO Box 19002, 00501 Nairobi, Kenya',
  },
  SA: {
    name: 'South African Airways',
    claimsEmail: 'customercare@flysaa.com',
    claimsFormUrl: 'https://www.flysaa.com/za/en/saa/contact',
    mailingAddress: 'South African Airways, Customer Relations, Private Bag X13, OR Tambo International Airport, 1627, South Africa',
  },
  WB: {
    name: 'RwandAir',
    claimsEmail: 'customerservice@rwandair.com',
    claimsFormUrl: 'https://www.rwandair.com/help',
    mailingAddress: 'RwandAir, Customer Service, Kigali International Airport, PO Box 7275, Kigali, Rwanda',
  },
  // ── Asian carriers ────────────────────────────────
  KE: {
    name: 'Korean Air',
    claimsEmail: null,
    claimsFormUrl: 'https://www.koreanair.com/us/en/help',
    mailingAddress: 'Korean Air, Customer Relations, 260 Haneul-gil, Gangseo-gu, Seoul 07505, South Korea',
    webFormOnly: true,
  },
  OZ: {
    name: 'Asiana Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://flyasiana.com/C/GB/EN/help/contact',
    mailingAddress: 'Asiana Airlines, Customer Relations, 443 Dogok-ro, Gangseo-gu, Seoul 07505, South Korea',
    webFormOnly: true,
  },
  JL: {
    name: 'Japan Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.jal.com/en/contactjal/',
    mailingAddress: 'Japan Airlines, Customer Relations, Shinagawa Intercity Tower A, 2-15-1 Konan, Minato-ku, Tokyo 108-6020, Japan',
    webFormOnly: true,
  },
  NH: {
    name: 'All Nippon Airways (ANA)',
    claimsEmail: null,
    claimsFormUrl: 'https://www.ana.co.jp/en/us/support/',
    mailingAddress: 'ANA, Customer Relations, Shiodome City Center, 1-5-2 Higashi-Shimbashi, Minato-ku, Tokyo 105-7140, Japan',
    webFormOnly: true,
  },
  CX: {
    name: 'Cathay Pacific',
    claimsEmail: null,
    claimsFormUrl: 'https://www.cathaypacific.com/cx/en_GB/support.html',
    mailingAddress: 'Cathay Pacific Airways, Customer Relations, Cathay City, 8 Scenic Road, Hong Kong International Airport, Hong Kong',
    webFormOnly: true,
  },
  SQ: {
    name: 'Singapore Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.singaporeair.com/en_UK/us/plan-travel/support/',
    mailingAddress: 'Singapore Airlines, Customer Affairs, Airline House, 25 Airline Road, Singapore 819829',
    webFormOnly: true,
  },
  TG: {
    name: 'Thai Airways',
    claimsEmail: 'customerrelations@thaiairways.com',
    claimsFormUrl: 'https://www.thaiairways.com/en/contact',
    mailingAddress: 'Thai Airways International, Customer Relations, 89 Vibhavadi Rangsit Road, Bangkok 10900, Thailand',
  },
  MH: {
    name: 'Malaysia Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.malaysiaairlines.com/my/en/support.html',
    mailingAddress: 'Malaysia Airlines, Customer Relations, Ground Floor, MAS Complex A, Sultan Abdul Aziz Shah Airport, 47200 Subang, Malaysia',
    webFormOnly: true,
  },
  GA: {
    name: 'Garuda Indonesia',
    claimsEmail: 'callcenter@garuda-indonesia.com',
    claimsFormUrl: 'https://www.garuda-indonesia.com/id/en/contact-us',
    mailingAddress: 'Garuda Indonesia, Customer Care, Garuda City, Cengkareng, Tangerang 19120, Indonesia',
  },
  PR: {
    name: 'Philippine Airlines',
    claimsEmail: 'customercare@philippineairlines.com',
    claimsFormUrl: 'https://www.philippineairlines.com/en/home/help-center',
    mailingAddress: 'Philippine Airlines, Customer Relations, PAL Center Building, Legaspi Village, 1226 Makati City, Philippines',
  },
  VN: {
    name: 'Vietnam Airlines',
    claimsEmail: 'customerservice@vietnamairlines.com',
    claimsFormUrl: 'https://www.vietnamairlines.com/en/gb/informationdetail',
    mailingAddress: 'Vietnam Airlines, Customer Service, 200 Nguyen Son Street, Long Bien District, Hanoi, Vietnam',
  },
  AI: {
    name: 'Air India',
    claimsEmail: null,
    claimsFormUrl: 'https://www.airindia.com/in/en/help-support.html',
    mailingAddress: 'Air India, Customer Relations, Airlines House, 113 Gurudwara Rakab Ganj Road, New Delhi 110001, India',
    webFormOnly: true,
  },
  '6E': {
    name: 'IndiGo',
    claimsEmail: null,
    claimsFormUrl: 'https://www.goindigo.in/contact-us.html',
    mailingAddress: 'IndiGo, Customer Care, Central Wing, Ground Floor, Ilyushin Building, Palam, New Delhi 110037, India',
    webFormOnly: true,
  },
  SG: {
    name: 'SpiceJet',
    claimsEmail: 'customercare@spicejet.com',
    claimsFormUrl: 'https://www.spicejet.com/contact.aspx',
    mailingAddress: 'SpiceJet, Customer Care, 319 Udyog Vihar, Phase IV, Gurugram 122016, Haryana, India',
  },
  CI: {
    name: 'China Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.china-airlines.com/tw/en/fly/customer-service',
    mailingAddress: 'China Airlines, Customer Relations, 68 Dunhua N. Road, Songshan District, Taipei 10544, Taiwan',
    webFormOnly: true,
  },
  BR: {
    name: 'EVA Air',
    claimsEmail: null,
    claimsFormUrl: 'https://www.evaair.com/en-global/services/contact-us/',
    mailingAddress: 'EVA Airways, Customer Relations, 376 Hsin-Nan Road, Sec. 1, Lujhu, Taoyuan 33844, Taiwan',
    webFormOnly: true,
  },
  CA: {
    name: 'Air China',
    claimsEmail: null,
    claimsFormUrl: 'https://www.airchina.com.cn/en/service/service_feedback.shtml',
    mailingAddress: 'Air China, Customer Relations, No. 30 Tianzhu Road, Airport Industrial Zone, Shunyi District, Beijing 101312, China',
    webFormOnly: true,
  },
  MU: {
    name: 'China Eastern Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://us.ceair.com/en/help-centre/',
    mailingAddress: 'China Eastern Airlines, Customer Relations, 2550 Hongqiao Road, Shanghai 200335, China',
    webFormOnly: true,
  },
  CZ: {
    name: 'China Southern Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.csair.com/en/service/contact/',
    mailingAddress: 'China Southern Airlines, Customer Relations, 278 Ji Chang Road, Guangzhou 510405, China',
    webFormOnly: true,
  },
  HU: {
    name: 'Hainan Airlines',
    claimsEmail: 'service@hnair.com',
    claimsFormUrl: 'https://www.hnair.com/en/service/contact',
    mailingAddress: 'Hainan Airlines, Customer Relations, No. 29 Haifu Avenue, Haikou 570203, Hainan, China',
  },
  // ── Oceania carriers ──────────────────────────────
  QF: {
    name: 'Qantas',
    claimsEmail: null,
    claimsFormUrl: 'https://www.qantas.com/au/en/support/contact-us.html',
    mailingAddress: 'Qantas Airways, Customer Care, 10 Bourke Road, Mascot, NSW 2020, Australia',
    webFormOnly: true,
  },
  NZ: {
    name: 'Air New Zealand',
    claimsEmail: null,
    claimsFormUrl: 'https://www.airnewzealand.co.nz/feedback',
    mailingAddress: 'Air New Zealand, Customer Relations, Private Bag 92007, Auckland 1142, New Zealand',
    webFormOnly: true,
  },
  VA: {
    name: 'Virgin Australia',
    claimsEmail: null,
    claimsFormUrl: 'https://www.virginaustralia.com/au/en/help/contact-us/',
    mailingAddress: 'Virgin Australia, Customer Relations, PO Box 1034, Spring Hill, QLD 4004, Australia',
    webFormOnly: true,
  },
  JQ: {
    name: 'Jetstar',
    claimsEmail: null,
    claimsFormUrl: 'https://www.jetstar.com/au/en/help/articles/contact-us',
    mailingAddress: 'Jetstar Airways, Customer Care, PO Box 4713, Melbourne, VIC 3001, Australia',
    webFormOnly: true,
  },
  FJ: {
    name: 'Fiji Airways',
    claimsEmail: 'customercare@fijiairways.com',
    claimsFormUrl: 'https://www.fijiairways.com/en-gb/contact-us',
    mailingAddress: 'Fiji Airways, Customer Care, 185 Victoria Parade, Suva, Fiji',
  },
  // ── Latin American carriers ───────────────────────
  AM: {
    name: 'Aeroméxico',
    claimsEmail: null,
    claimsFormUrl: 'https://aeromexico.com/en-us/contact-us',
    mailingAddress: 'Aeroméxico, Customer Relations, Paseo de la Reforma 445, Col. Cuauhtémoc, Mexico City 06500, Mexico',
    webFormOnly: true,
  },
  AV: {
    name: 'Avianca',
    claimsEmail: null,
    claimsFormUrl: 'https://www.avianca.com/us/en/before-your-trip/contact-us/',
    mailingAddress: 'Avianca, Customer Relations, Calle 36 No. 7-41, Bogotá, Colombia',
    webFormOnly: true,
  },
  CM: {
    name: 'Copa Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.copaair.com/en/web/us/contact-us',
    mailingAddress: 'Copa Airlines, Customer Relations, Av. Principal y Av. De la Rotonda, Panama City, Panama',
    webFormOnly: true,
  },
  LA: {
    name: 'LATAM Airlines',
    claimsEmail: null,
    claimsFormUrl: 'https://www.latam.com/en_us/atencao/contato/',
    mailingAddress: 'LATAM Airlines, Customer Relations, Presidente Riesco 5711, Las Condes, Santiago, Chile',
    webFormOnly: true,
  },
  AR: {
    name: 'Aerolíneas Argentinas',
    claimsEmail: 'clientes@aerolineas.com.ar',
    claimsFormUrl: 'https://www.aerolineas.com.ar/en/contact',
    mailingAddress: 'Aerolíneas Argentinas, Servicio al Cliente, Bouchard 547, C1106ABG Buenos Aires, Argentina',
  },
  G3: {
    name: 'GOL Airlines',
    claimsEmail: 'sac@voegol.com.br',
    claimsFormUrl: 'https://www.voegol.com.br/en/help/contact-us',
    mailingAddress: 'GOL Linhas Aéreas, Customer Relations, Praça Comandante Linneu Gomes s/n, São Paulo-Guarulhos Airport, Brazil',
  },
  AD: {
    name: 'Azul Brazilian Airlines',
    claimsEmail: 'sac@voeazul.com.br',
    claimsFormUrl: 'https://www.voeazul.com.br/en/customer-service',
    mailingAddress: 'Azul Linhas Aéreas, Customer Relations, Av. Marcos Penteado de Ulhôa Rodrigues 939, Barueri, SP 06460-040, Brazil',
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
  // Europe
  EZY: 'U2',  // easyJet
  RYR: 'FR',  // Ryanair
  BAW: 'BA',  // British Airways
  DLH: 'LH',  // Lufthansa
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
  EWG: 'EW',  // Eurowings
  TRA: 'HV',  // Transavia
  LOT: 'LO',  // LOT Polish Airlines
  CSA: 'OK',  // Czech Airlines
  ROT: 'RO',  // TAROM
  ASL: 'JU',  // Air Serbia
  AEE: 'A3',  // Aegean Airlines
  OAL: 'OA',  // Olympic Air
  ICE: 'FI',  // Icelandair
  BTI: 'BT',  // airBaltic
  LGL: 'LG',  // Luxair
  CFG: 'DE',  // Condor
  TUI: 'X3',  // TUIfly Germany
  TFL: 'OR',  // TUI fly Netherlands
  IBB: 'NT',  // Binter Canarias
  VOE: 'V7',  // Volotea
  AJA: 'VF',  // AJet
  OHY: '8Q',  // Onur Air
  AFL: 'SU',  // Aeroflot
  UTA: 'UT',  // UTair
  SBI: 'S7',  // S7 Airlines
  TVS: 'QS',  // SmartWings
  WRC: '7W',  // Wind Rose Aviation
  DTR: 'DX',  // DAT
  WIF: 'WF',  // Widerøe
  AUI: 'PS',  // Ukraine International Airlines
  FIA: '5F',  // Fly One
  CCM: 'XK',  // Air Corsica
  JAF: 'TB',  // TUI fly Belgium
  NLY: 'HG',  // HiSky
  MON: 'ZB',  // Monarch (defunct)
  BEE: 'BE',  // Flybe (defunct)
  // UK
  TOM: 'BY',  // TUI Airways
  EXS: 'LS',  // Jet2
  // Canada
  ACA: 'AC',  // Air Canada
  WJA: 'WS',  // WestJet
  TSC: 'TS',  // Air Transat
  POE: 'PD',  // Porter Airlines
  PCO: '8P',  // Pacific Coastal Airlines
  LNX: 'Y9',  // Lynx Air (defunct)
  // Turkey
  THY: 'TK',  // Turkish Airlines
  PGT: 'PC',  // Pegasus Airlines
  // USA
  AAL: 'AA',  // American Airlines
  DAL: 'DL',  // Delta Air Lines
  UAL: 'UA',  // United Airlines
  JBU: 'B6',  // JetBlue
  ASA: 'AS',  // Alaska Airlines
  SWA: 'WN',  // Southwest Airlines
  NKS: 'NK',  // Spirit Airlines
  FFT: 'F9',  // Frontier Airlines
  HAL: 'HA',  // Hawaiian Airlines
  // Middle East
  UAE: 'EK',  // Emirates
  QTR: 'QR',  // Qatar Airways
  ETD: 'EY',  // Etihad Airways
  SVA: 'SV',  // Saudia
  GFA: 'GF',  // Gulf Air
  OMA: 'WY',  // Oman Air
  KAC: 'KU',  // Kuwait Airways
  RJA: 'RJ',  // Royal Jordanian
  MEA: 'ME',  // Middle East Airlines
  ELY: 'LY',  // El Al
  // Africa
  MSR: 'MS',  // EgyptAir
  RAM: 'AT',  // Royal Air Maroc
  TAR: 'TU',  // Tunisair
  DAH: 'AH',  // Air Algérie
  ETH: 'ET',  // Ethiopian Airlines
  KQA: 'KQ',  // Kenya Airways
  SAA: 'SA',  // South African Airways
  RWD: 'WB',  // RwandAir
  // Asia
  KAL: 'KE',  // Korean Air
  AAR: 'OZ',  // Asiana Airlines
  JAL: 'JL',  // Japan Airlines
  ANA: 'NH',  // ANA
  CPA: 'CX',  // Cathay Pacific
  SIA: 'SQ',  // Singapore Airlines
  THA: 'TG',  // Thai Airways
  MAS: 'MH',  // Malaysia Airlines
  GIA: 'GA',  // Garuda Indonesia
  PAL: 'PR',  // Philippine Airlines
  HVN: 'VN',  // Vietnam Airlines
  AIC: 'AI',  // Air India
  IGO: '6E',  // IndiGo
  SEJ: 'SG',  // SpiceJet
  CAL: 'CI',  // China Airlines
  EVA: 'BR',  // EVA Air
  CCA: 'CA',  // Air China
  CES: 'MU',  // China Eastern
  CSN: 'CZ',  // China Southern
  CHH: 'HU',  // Hainan Airlines
  // Oceania
  QFA: 'QF',  // Qantas
  ANZ: 'NZ',  // Air New Zealand
  VOZ: 'VA',  // Virgin Australia
  JST: 'JQ',  // Jetstar
  FJI: 'FJ',  // Fiji Airways
  // Latin America
  AMX: 'AM',  // Aeroméxico
  AVA: 'AV',  // Avianca
  CMP: 'CM',  // Copa Airlines
  LAN: 'LA',  // LATAM Airlines
  ARG: 'AR',  // Aerolíneas Argentinas
  GLO: 'G3',  // GOL Airlines
  AZU: 'AD',  // Azul Brazilian Airlines
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
 * Returns null for unrecognised airlines — the PDF builder handles this case
 * with a generic "search for your airline's claims contact" message.
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
