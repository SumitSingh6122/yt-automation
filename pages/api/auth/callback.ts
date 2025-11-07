import type { NextApiRequest, NextApiResponse } from 'next';
import { getTokensFromCode } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    // Store tokens in session/cookie or return to frontend
    // For simplicity, we'll redirect with tokens in query params
    // In production, use secure session storage
    const redirectUrl = `/dashboard?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ''}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

