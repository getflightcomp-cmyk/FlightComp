import { readClaims } from '../../../lib/claims';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const claims = readClaims();
  return res.status(200).json({ claims });
}
