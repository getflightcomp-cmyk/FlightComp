/**
 * READ-ONLY diagnostic script — safe to delete after use.
 * Tests the getAirlineContact() function against 40 representative inputs.
 *
 * Usage: node scripts/test-airline-recognition.mjs
 */

import { getAirlineContact } from '../lib/airline-contacts.js';

const tests = [
  // ── TEST 1: IATA flight numbers ──────────────────────────────────────────
  { input: 'LH1234',   expect: 'Lufthansa',                  group: 'IATA flight number' },
  { input: 'FR1234',   expect: 'Ryanair',                    group: 'IATA flight number' },
  { input: 'U2 8001',  expect: 'easyJet',                    group: 'IATA flight number (with space)' },
  { input: 'BA456',    expect: 'British Airways',            group: 'IATA flight number' },
  { input: 'AF1680',   expect: 'Air France',                 group: 'IATA flight number' },
  { input: 'KL1234',   expect: 'KLM',                        group: 'IATA flight number' },
  { input: 'TK1234',   expect: 'Turkish Airlines',           group: 'IATA flight number' },
  { input: 'W6 1234',  expect: 'Wizz Air',                   group: 'IATA flight number (with space)' },
  { input: 'AC856',    expect: 'Air Canada',                 group: 'IATA flight number' },
  { input: 'WS1234',   expect: 'WestJet',                    group: 'IATA flight number' },
  { input: 'EK201',    expect: 'Emirates',                   group: 'IATA flight number' },
  { input: 'DL100',    expect: 'Delta Air Lines',            group: 'IATA flight number' },
  { input: 'PC1234',   expect: 'Pegasus Airlines',           group: 'IATA flight number' },
  { input: 'DY1234',   expect: 'Norwegian Air Shuttle',      group: 'IATA flight number' },
  { input: 'VY1234',   expect: 'Vueling',                    group: 'IATA flight number' },
  // ── TEST 2: ICAO flight numbers ──────────────────────────────────────────
  { input: 'EZY8001',  expect: 'easyJet',                    group: 'ICAO flight number' },
  { input: 'RYR1234',  expect: 'Ryanair',                    group: 'ICAO flight number' },
  { input: 'BAW456',   expect: 'British Airways',            group: 'ICAO flight number' },
  { input: 'DLH1234',  expect: 'Lufthansa',                  group: 'ICAO flight number' },
  { input: 'THY1234',  expect: 'Turkish Airlines',           group: 'ICAO flight number' },
  { input: 'SXS1234',  expect: 'SunExpress',                 group: 'ICAO flight number' },
  { input: 'WZZ1234',  expect: 'Wizz Air',                   group: 'ICAO flight number' },
  { input: 'ACA856',   expect: 'Air Canada',                 group: 'ICAO flight number' },
  // ── TEST 3: Fuzzy name matching ──────────────────────────────────────────
  { input: 'easyjet',          expect: 'easyJet',            group: 'Fuzzy name' },
  { input: 'easy jet',         expect: 'easyJet',            group: 'Fuzzy name (with space)' },
  { input: 'british airways',  expect: 'British Airways',    group: 'Fuzzy name' },
  { input: 'BA',               expect: 'British Airways',    group: 'Fuzzy name (code as name)' },
  { input: 'turkish',          expect: 'Turkish Airlines',   group: 'Fuzzy name (partial)' },
  { input: 'air canada',       expect: 'Air Canada',         group: 'Fuzzy name' },
  { input: 'ryanair',          expect: 'Ryanair',            group: 'Fuzzy name' },
  { input: 'wizz',             expect: 'Wizz Air',           group: 'Fuzzy name (partial)' },
  { input: 'pegasus',          expect: 'Pegasus Airlines',   group: 'Fuzzy name (partial)' },
  { input: 'sunexpress',       expect: 'SunExpress',         group: 'Fuzzy name' },
  // ── TEST 4: Edge cases ───────────────────────────────────────────────────
  { input: 'F8 1234',  expect: 'Flair Airlines',             group: 'Edge case (small carrier, space)' },
  { input: 'XQ1234',   expect: 'SunExpress',                 group: 'Edge case (IATA)' },
  { input: 'VF1234',   expect: 'AJet',                       group: 'Edge case (rebranded airline)' },
  { input: 'LS1234',   expect: 'Jet2',                       group: 'Edge case' },
  { input: 'jet2',     expect: 'Jet2',                       group: 'Edge case (fuzzy)' },
  { input: 'QR100',    expect: 'Qatar Airways',              group: 'Edge case' },
  { input: 'SQ321',    expect: 'Singapore Airlines',         group: 'Edge case' },
];

// ── Run tests ────────────────────────────────────────────────────────────────
const COL = { input: 14, detected: 36, expected: 36, status: 8, group: 36 };
const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
const hr  = '─'.repeat(COL.input + COL.detected + COL.expected + COL.status + COL.group + 12);

console.log('\n' + hr);
console.log(
  pad('INPUT', COL.input) + '  ' +
  pad('DETECTED', COL.detected) + '  ' +
  pad('EXPECTED', COL.expected) + '  ' +
  pad('STATUS', COL.status) + '  ' +
  pad('GROUP', COL.group)
);
console.log(hr);

let correct = 0, notRecognized = 0, partial = 0;
const failures = [];

for (const { input, expect, group } of tests) {
  const result = getAirlineContact(input);
  const detected = result?.name ?? 'NOT RECOGNIZED';

  let status;
  if (!result) {
    status = '❌ MISS';
    notRecognized++;
    failures.push({ input, expect, detected, group, reason: 'not recognized' });
  } else if (detected === expect) {
    status = '✅ YES';
    correct++;
  } else {
    status = '⚠️  PART';
    partial++;
    failures.push({ input, expect, detected, group, reason: 'wrong match' });
  }

  console.log(
    pad(input, COL.input) + '  ' +
    pad(detected, COL.detected) + '  ' +
    pad(expect, COL.expected) + '  ' +
    pad(status, COL.status) + '  ' +
    pad(group, COL.group)
  );
}

console.log(hr);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n══ SUMMARY ═══════════════════════════════════════════════');
console.log(`  Total tested:             ${tests.length}`);
console.log(`  ✅ Correct:               ${correct}`);
console.log(`  ❌ Not recognized (miss): ${notRecognized}`);
console.log(`  ⚠️  Wrong match (partial): ${partial}`);
console.log('══════════════════════════════════════════════════════════');

if (failures.length > 0) {
  console.log('\n── Failures requiring fixes: ──────────────────────────────');
  for (const { input, expect, detected, group, reason } of failures) {
    console.log(`  [${reason.toUpperCase()}]  "${input}"`);
    console.log(`          Expected:  ${expect}`);
    console.log(`          Got:       ${detected}`);
    console.log(`          Group:     ${group}`);
  }
  console.log('────────────────────────────────────────────────────────────\n');
} else {
  console.log('\n  🎉 All tests passed!\n');
}
