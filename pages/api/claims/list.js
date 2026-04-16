import { readClaims } from '../../../lib/claims';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const claims = await readClaims();
  return res.status(200).json({ claims });
}
