import fs from 'fs';
import path from 'path';

const DATA_DIR  = path.join(process.cwd(), 'data');
const CLAIMS_FILE = path.join(DATA_DIR, 'claims.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readClaims() {
  ensureDir();
  if (!fs.existsSync(CLAIMS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8')); } catch { return []; }
}

export function writeClaims(claims) {
  ensureDir();
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
}

export function getClaimById(id) {
  return readClaims().find(c => c.id === id) || null;
}

export function saveClaim(claim) {
  const claims = readClaims();
  const idx = claims.findIndex(c => c.id === claim.id);
  if (idx === -1) claims.push(claim);
  else claims[idx] = claim;
  writeClaims(claims);
  return claim;
}

/** Returns a new claim object with an event appended — does NOT persist. Call saveClaim() after. */
export function addEvent(claim, action, details, triggeredBy = 'system') {
  return {
    ...claim,
    updatedAt: new Date().toISOString(),
    history: [
      ...(claim.history || []),
      { timestamp: new Date().toISOString(), action, details, triggeredBy },
    ],
  };
}
