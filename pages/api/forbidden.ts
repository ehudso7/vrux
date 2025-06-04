import type { NextApiRequest, NextApiResponse } from 'next';
import logger from '../../lib/logger';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the forbidden access attempt
  logger.warn('Forbidden domain access attempt', {
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    url: req.url,
  });

  res.status(403).json({
    error: 'Forbidden',
    message: 'This service can only be accessed from vrux.dev',
    code: 'DOMAIN_FORBIDDEN'
  });
}