import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Auth API is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    method: req.method,
    url: req.url
  });
}