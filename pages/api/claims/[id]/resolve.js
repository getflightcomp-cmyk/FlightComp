import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  const { resolutionType, notes } = req.body || {};

  let claim = await getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });

  const now = new Date().toISOString();
  claim = { ...claim, status: 'resolved', resolvedAt: now, updatedAt: now };
  claim = addEvent(
    claim,
    'claim_resolved',
    `Claim marked resolved. Type: ${resolutionType || 'unspecified'}.${notes ? ` Notes: ${notes}` : ''}`,
    'admin'
  );

  await saveClaim(claim);
  return res.status(200).json({ ok: true, claim });
}
