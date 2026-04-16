import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { detectRegulation } from '../../../lib/eu261';
import { getCarrierRegion, resolveAirline } from '../../../lib/carriers';
import { getAirlineClaimsContact } from '../../../lib/airlineClaimsEmails';
import { saveClaim, addEvent } from '../../../lib/claims';

/** Extract 2-char IATA airline code from flight number (e.g. "LH1234" → "LH", "FR 1234" → "FR"). */
function extractAirlineCode(flightNumber) {
  if (!flightNumber) return null;
  const m = flightNumber.trim().toUpperCase().match(/^([A-Z]{2}|\d[A-Z]|[A-Z]\d)\s*\d/);
  return m ? m[1] : null;
}

const TEST_DATA = {
  authId: null, // assigned at runtime
  fullName:     'Test Passenger',
  email:        'support@getflightcomp.com', // change to your email to receive test notifications
  address:      '123 Test Street, Dublin, Ireland',
  airline:      'Ryanair',
  flightNumber: 'FR1234',
  flightDate:   '2026-03-15',
  depAirport:   'DUB',
  arrAirport:   'STN',
  disruptionType: 'Cancellation',
  bookingRef:   'TEST01',
  scheduledArrival: '09:00',
  actualArrival:    '',
  description:  'Flight was cancelled without notice 2 hours before departure.',
  submittedAt:  null,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { authorizationId, isTest } = req.body || {};

  let authData;

  if (isTest) {
    authData = { ...TEST_DATA, authId: crypto.randomUUID(), submittedAt: new Date().toISOString() };
  } else {
    if (!authorizationId) {
      return res.status(400).json({ error: 'authorizationId is required' });
    }
    const authFile = path.join(process.cwd(), 'data', 'authorizations.json');
    if (!fs.existsSync(authFile)) {
      return res.status(404).json({ error: 'Authorization not found' });
    }
    try {
      const auths = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      authData = auths.find(a => a.authId === authorizationId);
    } catch {
      return res.status(500).json({ error: 'Failed to read authorizations' });
    }
    if (!authData) return res.status(404).json({ error: 'Authorization not found' });
  }

  // Check for duplicate claim
  const { readClaims } = await import('../../../lib/claims');
  const allClaims = await readClaims();
  const existing = allClaims.find(c => c.authorizationId === authData.authId);
  if (existing && !isTest) {
    return res.status(409).json({ error: 'A claim already exists for this authorization', claim: existing });
  }

  // Derive airline IATA code
  const airlineIataCode = extractAirlineCode(authData.flightNumber);

  // Detect regulation
  let regulation = 'EU261';
  try {
    const carrierRegion = airlineIataCode ? (getCarrierRegion(airlineIataCode) || null) : null;
    const detected = detectRegulation(authData.depAirport, authData.arrAirport, carrierRegion);
    if (detected) regulation = detected;
  } catch (err) {
    console.error('[claims/create] Regulation detection failed:', err.message);
  }

  // Read regulation from authorization if provided (set by /authorize page from query params)
  if (authData.regulation && !isTest) regulation = authData.regulation;

  const currency = regulation === 'UK261' ? 'GBP' : regulation === 'APPR' ? 'CAD' : 'EUR';

  // Lookup airline claims contact
  const airlineContact = airlineIataCode ? getAirlineClaimsContact(airlineIataCode) : null;

  // Try to get airline name from carrier registry
  let airlineName = authData.airline;
  try {
    const resolved = resolveAirline(airlineIataCode || authData.flightNumber);
    if (resolved?.name) airlineName = resolved.name;
  } catch { /* keep original */ }

  const now = new Date().toISOString();
  const claimId = crypto.randomUUID();

  let claim = {
    id: claimId,
    authorizationId: authData.authId,
    status: 'authorized',
    regulation,

    passengerName:    authData.fullName,
    passengerEmail:   authData.email,
    passengerAddress: authData.address,

    airline:          airlineName,
    airlineIataCode,
    flightNumber:     authData.flightNumber,
    flightDate:       authData.flightDate,
    departureAirport: authData.depAirport,
    arrivalAirport:   authData.arrAirport,
    disruptionType:   authData.disruptionType,
    bookingReference: authData.bookingRef || null,
    scheduledArrival: authData.scheduledArrival || null,
    actualArrival:    authData.actualArrival || null,
    description:      authData.description || null,

    estimatedCompensation: authData.estimatedCompensation
      ? parseFloat(String(authData.estimatedCompensation).replace(/[^0-9.]/g, ''))
      : null,
    currency,
    feePercentage: 25,

    claimLetterText:        null,
    claimLetterGeneratedAt: null,

    airlineEmail:   airlineContact?.claimsEmail || null,
    airlineFormUrl: airlineContact?.claimsFormUrl || null,
    submittedAt:    null,
    submittedVia:   null,

    airlineResponseReceived:       false,
    airlineResponseDate:           null,
    airlineResponseSummary:        null,
    airlineResponseClassification: null,

    followUpCount:         0,
    lastFollowUpDate:      null,
    escalatedToAuthority:  false,
    escalationAuthority:   null,
    escalationDate:        null,

    createdAt:  now,
    updatedAt:  now,
    resolvedAt: null,

    history: [],

    isTestClaim: isTest === true,
  };

  const contactNote = airlineContact?.claimsEmail
    ? `Claims email on file: ${airlineContact.claimsEmail}`
    : 'No direct claims email — form submission required.';

  claim = addEvent(
    claim,
    'claim_created',
    `Claim created from authorization ${authData.authId}. Regulation: ${regulation}. Airline: ${airlineName} (${airlineIataCode || 'unknown'}). ${contactNote}${isTest ? ' [TEST CLAIM]' : ''}`
  );

  try {
    await saveClaim(claim);
  } catch (err) {
    console.error('[claims/create] Failed to save:', err);
    return res.status(500).json({ error: 'Failed to save claim' });
  }

  return res.status(200).json({ ok: true, claim });
}
