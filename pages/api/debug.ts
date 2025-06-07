import type { NextApiResponse } from 'next';
import { requireAdmin, type AuthenticatedRequest } from '../../lib/middleware/auth';

function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  res.status(200).json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    },
    headers: req.headers,
    method: req.method,
    url: req.url,
  });
}

export default requireAdmin(handler);