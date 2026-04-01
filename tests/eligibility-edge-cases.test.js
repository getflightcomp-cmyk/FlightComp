/**
 * FlightComp — Eligibility Checker Edge-Case Tests
 *
 * Covers: EU261, UK261, Canada APPR, Turkey SHY
 * Tests the decision-tree logic directly without the UI.
 *
 * Run: npm test
 *
 * NOTES:
 *   #6  — BCN→BER is 1503 km (>1500 km threshold) — spec notes "< 1500 km" incorrectly
 */

import { describe, it, expect } from 'vitest';
import {
  assessClaim,
  assessClaimAPPR,
  assessClaimSHY,
  detectRegulation,
} from '../lib/eu261.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Use a date within the last year so APPR/SHY 1-year limits are satisfied,
// and well within EU261 (3yr) / UK261 (6yr) limits.
const RECENT_DATE = '2026-01-15';

/** Build a minimal EU261/UK261 answers object */
function eu261Answers(overrides) {
  return {
    disruption: 'delayed',
    flightNumber: 'XX 000',
    flightDate: RECENT_DATE,
    from: '',
    to: '',
    delayLength: '4plus',
    reason: 'technical',
    ...overrides,
  };
}

/** Build a minimal APPR answers object */
function apprAnswers(overrides) {
  return {
    disruption: 'delayed',
    flightNumber: 'XX 000',
    flightDate: RECENT_DATE,
    from: '',
    to: '',
    apprDelayTier: '3to6',
    airlineSize: 'large',
    apprReason: 'controlled',
    ...overrides,
  };
}

/** Build a minimal SHY answers object */
function shyAnswers(overrides) {
  return {
    disruption: 'cancelled',
    flightNumber: 'XX 000',
    flightDate: RECENT_DATE,
    from: '',
    to: '',
    delayLength: '',
    shyReason: 'airline',
    shyNotified14: 'no',
    ...overrides,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// EU261 / UK261
// ─────────────────────────────────────────────────────────────────────────────

describe('EU261 / UK261', () => {

  // ── Test 1 ──────────────────────────────────────────────────────────────────
  // Connecting JFK→FRA→FCO, Lufthansa (EU carrier). EU261 Art. 3(1)(b) covers
  // non-EU departures operated by an EU carrier.
  it('1. Connecting JFK→FRA→FCO, Lufthansa EU carrier, 5 h late → Likely €600', () => {
    // With carrier region passed, detectRegulation should return EU261
    expect(detectRegulation('JFK', 'FCO', 'EU')).toBe('EU261');

    const result = assessClaim(eu261Answers({
      from: 'JFK', to: 'FCO',
      delayLength: '4plus',
      reason: 'technical',
      airlineCode: 'LH',
      carrierRegion: 'EU',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.compensation?.amount).toBe('€600');
  });


  // ── Test 2 ──────────────────────────────────────────────────────────────────
  // Codeshare: booked BA, operated Iberia (EU carrier). Operating carrier rule:
  // EU carrier on UK→EU route → EU261 applies (not UK261).
  it('2. LHR→CDG, BA booked / Iberia operated, cancelled → EU261 €250', () => {
    // Without carrier: UK departure → UK261
    expect(detectRegulation('LHR', 'CDG')).toBe('UK261');
    // With EU carrier: operating carrier rule → EU261
    expect(detectRegulation('LHR', 'CDG', 'EU')).toBe('EU261');

    const result = assessClaim(eu261Answers({
      from: 'LHR', to: 'CDG',
      disruption: 'cancelled',
      delayLength: '',
      reason: 'none',
      airlineCode: 'IB',
      carrierRegion: 'EU',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.regulation).toBe('EU261');
    expect(result.compensation?.amount).toBe('€250');
  });


  // ── Test 3 ──────────────────────────────────────────────────────────────────
  // Non-EU dep, non-EU carrier (Emirates DXB→AMS) → Unlikely Eligible ✓
  it('3. DXB→AMS, Emirates (non-EU carrier), 4 h delay → Unlikely Eligible', () => {
    // No carrier → not covered by any supported regulation
    expect(detectRegulation('DXB', 'AMS')).toBeNull();

    const result = assessClaim(eu261Answers({
      from: 'DXB', to: 'AMS',
      delayLength: '4plus',
      reason: 'technical',
    }));

    // dep=DXB (OTHER), no EU/UK carrier → unlikely
    expect(result.verdict).toBe('unlikely');
  });


  // ── Test 4 ──────────────────────────────────────────────────────────────────
  // Non-EU dep, EU carrier (KLM DXB→AMS). EU261 Art. 3(1)(b): EU carriers
  // from non-EU airports are covered.
  it('4. DXB→AMS, KLM (EU carrier), 4 h delay → Likely €600', () => {
    const result = assessClaim(eu261Answers({
      from: 'DXB', to: 'AMS',
      delayLength: '4plus',
      reason: 'technical',
      airlineCode: 'KL',
      carrierRegion: 'EU',
    }));

    // EU carrier → covered; DXB→AMS ≈ 5169 km → €600 tier
    expect(result.verdict).toBe('likely');
    expect(result.compensation?.amount).toBe('€600');
  });


  // ── Test 5 ──────────────────────────────────────────────────────────────────
  // Extraordinary circumstances — weather → Unlikely Eligible ✓
  it('5. BCN→BER, Ryanair, cancelled due to severe weather → Unlikely Eligible', () => {
    const result = assessClaim(eu261Answers({
      from: 'BCN', to: 'BER',
      disruption: 'cancelled',
      delayLength: '',
      reason: 'weather',
    }));

    expect(result.verdict).toBe('unlikely');
    expect(result.regulation).toBe('EU261');
  });


  // ── Test 6 ──────────────────────────────────────────────────────────────────
  // Technical fault is NOT extraordinary circumstances → compensation owed.
  // NOTE: Spec states "€250 (< 1500 km)" but BCN→BER haversine = 1503 km.
  // Our function correctly returns €400 (1500–3500 km tier).
  // The spec's distance assumption appears to be slightly off.
  // Test asserts verdict='likely' and reports the distance discrepancy.
  it('6. BCN→BER, Ryanair, cancelled due to technical fault → Likely (distance note)', () => {
    const result = assessClaim(eu261Answers({
      from: 'BCN', to: 'BER',
      disruption: 'cancelled',
      delayLength: '',
      reason: 'technical',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.regulation).toBe('EU261');

    // Spec says €250 (<1500 km). Haversine gives 1503 km → €400 tier.
    // We assert the correct computed value:
    expect(result.distanceKm).toBeGreaterThan(1500);
    expect(result.compensation?.amount).toBe('€400');
    // ↑ If this were <1500 km it would be €250 as spec says.
    // Verdict: spec note is slightly incorrect; code behaviour is correct.
  });


  // ── Test 7 ──────────────────────────────────────────────────────────────────
  // Delay exactly 3 hours — meets compensation threshold ✓
  it('7. CDG→MAD (1064 km), exactly 3 h late → Likely €250', () => {
    // delayLength='3to4' maps to 3.5 h which is ≥ 3 h threshold
    const result = assessClaim(eu261Answers({
      from: 'CDG', to: 'MAD',
      delayLength: '3to4',
      reason: 'technical',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.regulation).toBe('EU261');
    expect(result.distanceKm).toBe(1064);
    expect(result.compensation?.amount).toBe('€250');
  });


  // ── Test 8 ──────────────────────────────────────────────────────────────────
  // Delay 2 h 59 min — just under threshold → Unlikely ✓
  it('8. CDG→MAD, 2 h 59 min delay (under threshold) → Unlikely Eligible', () => {
    // delayLength='2to3' maps to 2.5 h which is < 3 h threshold
    const result = assessClaim(eu261Answers({
      from: 'CDG', to: 'MAD',
      delayLength: '2to3',
      reason: 'technical',
    }));

    expect(result.verdict).toBe('unlikely');
  });


  // ── Test 9 ──────────────────────────────────────────────────────────────────
  // UK261 domestic — cancelled, 5 days notice ✓
  it('9. LHR→EDI (533 km), UK261, cancelled 5 days notice → Likely £220', () => {
    const result = assessClaim(eu261Answers({
      from: 'LHR', to: 'EDI',
      disruption: 'cancelled',
      delayLength: '',
      reason: 'technical',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.regulation).toBe('UK261');
    expect(result.distanceKm).toBe(533);
    expect(result.compensation?.amount).toBe('£220');
  });


  // ── Test 10 ─────────────────────────────────────────────────────────────────
  // UK261 international — 4 h delay, UK carrier ✓
  it('10. LHR→JFK (5539 km), UK261, BA, 4 h delay → Likely £520', () => {
    const result = assessClaim(eu261Answers({
      from: 'LHR', to: 'JFK',
      delayLength: '4plus',
      reason: 'technical',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.regulation).toBe('UK261');
    expect(result.distanceKm).toBe(5539);
    expect(result.compensation?.amount).toBe('£520');
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Canada APPR
// ─────────────────────────────────────────────────────────────────────────────

describe('Canada APPR', () => {

  // ── Test 11 ─────────────────────────────────────────────────────────────────
  // Large airline, 4 h delay (3–6 h tier), within control → CA$400 ✓
  it('11. YYZ→YVR, Air Canada (large), 4 h delay (crew scheduling) → CA$400', () => {
    expect(detectRegulation('YYZ', 'YVR')).toBe('APPR');

    const result = assessClaimAPPR(apprAnswers({
      from: 'YYZ', to: 'YVR',
      apprDelayTier: '3to6',
      airlineSize: 'large',
      apprReason: 'controlled',
    }));

    expect(result.regulation).toBe('APPR');
    expect(result.verdict).toBe('likely');
    expect(result.compensation?.amount).toBe('CA$400');
  });


  // ── Test 12 ─────────────────────────────────────────────────────────────────
  // Large airline, 7 h delay (6–9 h tier), maintenance → CA$700 ✓
  it('12. YYZ→LHR, Air Canada (large), 7 h delay (maintenance) → CA$700', () => {
    expect(detectRegulation('YYZ', 'LHR')).toBe('APPR');

    const result = assessClaimAPPR(apprAnswers({
      from: 'YYZ', to: 'LHR',
      apprDelayTier: '6to9',
      airlineSize: 'large',
      apprReason: 'controlled',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.compensation?.amount).toBe('CA$700');
  });


  // ── Test 13 ─────────────────────────────────────────────────────────────────
  // Small airline, 4 h delay, unknown dep airport (YZF not in DB) ✓
  // APPR detection via arr=YEG (CA) still works when dep airport is unknown.
  it('13. YZF→YEG, Canadian North (small), 4 h delay → CA$125 (dep airport unknown)', () => {
    // YZF (Yellowknife) is not in our airport database.
    // detectRegulation falls through to arr=CA → APPR correctly.
    expect(detectRegulation('YZF', 'YEG')).toBe('APPR');

    const result = assessClaimAPPR(apprAnswers({
      from: 'YZF', to: 'YEG',
      apprDelayTier: '3to6',
      airlineSize: 'small',
      apprReason: 'controlled',
    }));

    expect(result.verdict).toBe('likely');
    expect(result.compensation?.amount).toBe('CA$125');
  });


  // ── Test 14 ─────────────────────────────────────────────────────────────────
  // Safety-related cancellation — no compensation under APPR ✓
  it('14. YUL→YYC, WestJet, cancelled (safety maintenance) → Unlikely Eligible', () => {
    const result = assessClaimAPPR(apprAnswers({
      disruption: 'cancelled',
      from: 'YUL', to: 'YYC',
      apprDelayTier: '',
      apprReason: 'safety',
    }));

    expect(result.verdict).toBe('unlikely');
    expect(result.verdictNote).toMatch(/safety/i);
  });


  // ── Test 15 ─────────────────────────────────────────────────────────────────
  // Weather cancellation — outside airline control → Unlikely ✓
  it('15. YHZ→YYZ, Air Canada, cancelled (snowstorm) → Unlikely Eligible', () => {
    const result = assessClaimAPPR(apprAnswers({
      disruption: 'cancelled',
      from: 'YHZ', to: 'YYZ',
      apprDelayTier: '',
      apprReason: 'uncontrolled',
    }));

    expect(result.verdict).toBe('unlikely');
    expect(result.verdictNote).toMatch(/uncontrolled/i);
  });


  // ── Test 16 ─────────────────────────────────────────────────────────────────
  // Delay under 3 hours — below APPR threshold ✓
  it('16. YOW→YUL, Porter, 2.5 h delay → Unlikely Eligible (below 3 h threshold)', () => {
    expect(detectRegulation('YOW', 'YUL')).toBe('APPR');

    const result = assessClaimAPPR(apprAnswers({
      from: 'YOW', to: 'YUL',
      apprDelayTier: 'under3',
      apprReason: 'controlled',
    }));

    expect(result.verdict).toBe('unlikely');
    expect(result.verdictNote).toMatch(/3.* hour/i);
  });

});


// ─────────────────────────────────────────────────────────────────────────────
// Turkey SHY
// ─────────────────────────────────────────────────────────────────────────────

describe('Turkey SHY', () => {

  // ── Test 17 ─────────────────────────────────────────────────────────────────
  // International cancellation departing Turkey → €400 (2489 km, 1500–3500 tier) ✓
  it('17. IST→LHR (2489 km), Turkish Airlines, cancelled 3 days notice → Likely €400', () => {
    expect(detectRegulation('IST', 'LHR')).toBe('SHY');

    const result = assessClaimSHY(shyAnswers({
      from: 'IST', to: 'LHR',
      disruption: 'cancelled',
      shyReason: 'airline',
      shyNotified14: 'no',
    }));

    expect(result.regulation).toBe('SHY');
    expect(result.verdict).toBe('likely');
    expect(result.isDomestic).toBe(false);
    expect(result.distanceKm).toBe(2489);
    expect(result.compensation?.raw).toBe(400);
    expect(result.compensation?.amount).toContain('€400');
  });


  // ── Test 18 ─────────────────────────────────────────────────────────────────
  // Delay from Turkey — SHY provides NO financial compensation for delays ✓
  it('18. IST→BER, Pegasus, 5 h delay → Unlikely (SHY: no delay compensation)', () => {
    expect(detectRegulation('IST', 'BER')).toBe('SHY');

    const result = assessClaimSHY(shyAnswers({
      from: 'IST', to: 'BER',
      disruption: 'delayed',
      delayLength: '4plus',
      shyReason: '',
      shyNotified14: '',
    }));

    expect(result.regulation).toBe('SHY');
    expect(result.verdict).toBe('unlikely');
    expect(result.compensation).toBeNull();
    expect(result.verdictNote).toMatch(/financial compensation is not available for delays/i);
    // Care rights should still be present for 5 h delay
    expect(result.careRights.length).toBeGreaterThan(0);
  });


  // ── Test 19 ─────────────────────────────────────────────────────────────────
  // Domestic Turkish cancellation (both airports TR) → flat €100 ✓
  it('19. IST→AYT (518 km, domestic), SunExpress, cancelled 2 days notice → Likely €100', () => {
    expect(detectRegulation('IST', 'AYT')).toBe('SHY');

    const result = assessClaimSHY(shyAnswers({
      from: 'IST', to: 'AYT',
      disruption: 'cancelled',
      shyReason: 'airline',
      shyNotified14: 'no',
    }));

    expect(result.regulation).toBe('SHY');
    expect(result.verdict).toBe('likely');
    expect(result.isDomestic).toBe(true);
    expect(result.compensation?.raw).toBe(100);
    expect(result.compensation?.amount).toContain('€100');
  });


  // ── Test 20 ─────────────────────────────────────────────────────────────────
  // EU dep to Turkey (Air France CDG→IST) → EU261 applies, NOT SHY ✓
  // SHY only covers departures from Turkey, or arrivals on Turkish carriers.
  // A non-Turkish carrier departing an EU airport → EU261 takes priority.
  it('20. CDG→IST, Air France (non-Turkish carrier) → EU261 applies, not SHY', () => {
    // EU dep takes priority in detectRegulation — should return EU261
    const reg = detectRegulation('CDG', 'IST');
    expect(reg).toBe('EU261');
    expect(reg).not.toBe('SHY');

    // Confirms EU261 covers this route correctly
    const result = assessClaim(eu261Answers({
      from: 'CDG', to: 'IST',
      disruption: 'cancelled',
      delayLength: '',
      reason: 'technical',
    }));

    expect(result.regulation).toBe('EU261');
    expect(result.verdict).toBe('likely');
  });

});
