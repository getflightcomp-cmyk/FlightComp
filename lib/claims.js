/**
 * Claims data layer — backed by Supabase.
 *
 * All functions are async. Claim objects remain in camelCase throughout the
 * app; the `data` JSONB column stores the full object verbatim.
 * The top-level columns (id, status, is_test, created_at, updated_at) exist
 * only for server-side indexing/filtering.
 */

import { adminClient } from './supabase';

/** Returns all claims ordered newest-first. */
export async function readClaims() {
  const { data, error } = await adminClient
    .from('claims')
    .select('data')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[claims] readClaims failed: ${error.message}`);
  return (data || []).map(row => row.data);
}

/** Returns a single claim by ID, or null if not found. */
export async function getClaimById(id) {
  const { data, error } = await adminClient
    .from('claims')
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`[claims] getClaimById failed: ${error.message}`);
  return data?.data || null;
}

/** Upserts a claim by id. Returns the claim object. */
export async function saveClaim(claim) {
  const { error } = await adminClient
    .from('claims')
    .upsert(
      {
        id:         claim.id,
        status:     claim.status,
        is_test:    claim.isTestClaim || false,
        created_at: claim.createdAt,
        updated_at: claim.updatedAt || new Date().toISOString(),
        data:       claim,
      },
      { onConflict: 'id' },
    );
  if (error) throw new Error(`[claims] saveClaim failed: ${error.message}`);
  return claim;
}

/**
 * Pure transform — appends an event to claim.history and bumps updatedAt.
 * Does NOT persist. Always call saveClaim() afterwards.
 */
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
