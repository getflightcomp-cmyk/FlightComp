/**
 * Shared purchase-record writer used by both the Stripe webhook and the
 * client-side fallback route (/api/save-kit-purchase).
 *
 * Idempotency: if a record with the same stripeSessionId already exists it is
 * silently skipped, so webhook + client-side backup never produce duplicates.
 */

import fs   from 'fs';
import path from 'path';

const DATA_DIR  = () => path.join(process.cwd(), 'data');
const FILE_PATH = () => path.join(DATA_DIR(), 'kit-purchases.json');

/**
 * @param {object} entry
 * @param {string}  entry.email
 * @param {string}  entry.name
 * @param {string}  entry.airline
 * @param {string}  entry.flightNumber
 * @param {string}  entry.route            e.g. "LGW–EDI"
 * @param {string}  entry.regulation       e.g. "UK261"
 * @param {string}  entry.compensationAmount  e.g. "£220"
 * @param {string}  [entry.stripeSessionId]
 * @param {string}  [entry.source]         "webhook" | "client"
 * @returns {{ ok: boolean, skipped?: boolean }}
 */
export function savePurchaseRecord(entry) {
  const dataDir  = DATA_DIR();
  const filePath = FILE_PATH();

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    let existing = [];
    if (fs.existsSync(filePath)) {
      try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { /* start fresh */ }
    }

    // Idempotency — skip duplicate Stripe session records
    if (entry.stripeSessionId) {
      const alreadySaved = existing.some(r => r.stripeSessionId === entry.stripeSessionId);
      if (alreadySaved) {
        console.log('[save-purchase] skipped duplicate stripeSessionId', entry.stripeSessionId);
        return { ok: true, skipped: true };
      }
    }

    const record = {
      email:                entry.email                || '',
      name:                 entry.name                 || '',
      airline:              entry.airline              || '',
      flightNumber:         entry.flightNumber         || '',
      route:                entry.route                || '',
      regulation:           entry.regulation           || '',
      compensationAmount:   entry.compensationAmount   || '',
      purchaseDate:         new Date().toISOString(),
      stripeSessionId:      entry.stripeSessionId      || null,
      source:               entry.source               || 'client',
      managedServiceSignup: false,
    };

    existing.push(record);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    return { ok: true };
  } catch (err) {
    console.error('[save-purchase] write error:', err);
    throw err;
  }
}
