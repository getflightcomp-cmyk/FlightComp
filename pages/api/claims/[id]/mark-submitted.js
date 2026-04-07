import { getClaimById, saveClaim, addEvent } from '../../../../lib/claims';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { id } = req.query;
  let claim = getClaimById(id);
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.submittedVia !== 'form_manual') {
    return res.status(400).json({ error: 'This claim was not flagged for manual form submission' });
  }

  const now = new Date().toISOString();
  claim = {
    ...claim,
    status: 'awaiting_response',
    submittedAt: claim.submittedAt || now,
    updatedAt: now,
  };
  claim = addEvent(
    claim,
    'manual_submission_confirmed',
    `Admin confirmed manual form submission to ${claim.airline} via ${claim.airlineFormUrl || 'airline website'}.`,
    'admin'
  );

  saveClaim(claim);
  return res.status(200).json({ ok: true, claim });
}
