import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return JSON for API routes
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
    code: 'ENDPOINT_NOT_FOUND'
  });
}