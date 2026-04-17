/**
 * ONE-TIME VERIFICATION SCRIPT — safe to delete after use.
 *
 * Sends a short verification email to every airline in the database that has
 * a claims email address, so we can identify bounces over the next 48 hours.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxxx node scripts/test-ping-airlines.mjs
 */

import { Resend } from 'resend';
import { AIRLINE_CONTACTS } from '../lib/airline-contacts.js';

// ── Guard: require RESEND_API_KEY ──────────────────────────────────────────────
if (!process.env.RESEND_API_KEY) {
  console.error('\n❌  Missing RESEND_API_KEY environment variable.');
  console.error('    Run with: RESEND_API_KEY=re_xxxx node scripts/test-ping-airlines.mjs\n');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Filter to airlines with a real claims email ────────────────────────────────
const targets = Object.entries(AIRLINE_CONTACTS)
  .filter(([, info]) => info.claimsEmail && !info.defunct)
  .map(([code, info]) => ({ code, name: info.name, email: info.claimsEmail }));

// Deduplicate by email address (e.g. BY and ZT share the same TUI address)
const seen = new Set();
const unique = targets.filter(({ email }) => {
  if (seen.has(email)) return false;
  seen.add(email);
  return true;
});

console.log(`\nFound ${unique.length} airline(s) with a claims email address.\n`);

// ── Email content ──────────────────────────────────────────────────────────────
const SUBJECT = 'Claims submission contact verification — FlightComp';

const TEXT = `Hello,

We are verifying that this is the correct email address for passenger compensation claims. Please disregard this message if received in error.

Thank you,
FlightComp
support@getflightcomp.com`;

const HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;padding:24px;max-width:600px;">
  <p>Hello,</p>
  <p>We are verifying that this is the correct email address for passenger compensation claims. Please disregard this message if received in error.</p>
  <p>Thank you,<br>FlightComp<br><a href="mailto:support@getflightcomp.com">support@getflightcomp.com</a></p>
</body>
</html>`;

// ── Send loop ──────────────────────────────────────────────────────────────────
const results = { sent: [], failed: [] };

for (const { code, name, email } of unique) {
  try {
    const { error } = await resend.emails.send({
      from: 'FlightComp <support@getflightcomp.com>',
      to: email,
      subject: SUBJECT,
      text: TEXT,
      html: HTML,
    });

    if (error) throw new Error(error.message || JSON.stringify(error));

    console.log(`[SENT]   ${name} (${code}) — ${email}`);
    results.sent.push({ name, email });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`[FAILED] ${name} (${code}) — ${msg}`);
    results.failed.push({ name, email, error: msg });
  }

  // 1-second delay between sends to stay within Resend rate limits
  await new Promise(r => setTimeout(r, 1000));
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────');
console.log(`  Total sent:   ${results.sent.length}`);
console.log(`  Total failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n  Failures:');
  for (const { name, email, error } of results.failed) {
    console.log(`    • ${name} <${email}>: ${error}`);
  }
}

console.log('──────────────────────────────────────────\n');
