import { Router, Request, Response } from 'express';
import { getSubdomains } from '../lib/whoisxml.js';

const router = Router();

/**
 * POST /api/discovery/subdomains
 * Body: { domain: string }
 *
 * Calls the WhoisXML Subdomain Lookup API and returns a structured list of
 * all discovered subdomains for the provided root domain.
 *
 * Response:
 * {
 *   domain: string,
 *   total: number,
 *   subdomains: { domain: string }[]
 * }
 */
router.post('/subdomains', async (req: Request, res: Response) => {
  const { domain } = req.body as { domain?: string };

  if (!domain || typeof domain !== 'string' || domain.trim() === '') {
    res.status(400).json({ error: 'A valid "domain" field is required in the request body.' });
    return;
  }

  // Basic sanitisation — strip protocol/paths if user pasted a full URL
  const sanitised = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')  // strip http(s)://
    .replace(/\/.*$/, '');        // strip any path

  try {
    const result = await getSubdomains(sanitised);

    if (!result) {
      res.status(502).json({
        error: 'Failed to retrieve data from the subdomain lookup service. Check the API key or try again later.',
      });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[Discovery] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
