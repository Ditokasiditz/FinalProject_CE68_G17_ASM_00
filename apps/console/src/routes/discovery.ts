import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getSubdomains } from '../lib/whoisxml.js';

const router = Router();
const prisma = new PrismaClient();

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

/**
 * POST /api/discovery/save-assets
 * Body: { domain: string, subdomains: string[] }
 *
 * Upserts every subdomain into the Asset table with type = "subdomain".
 * Uses the unique `hostname` field as the upsert key, so re-running discovery
 * on the same target cleanly overwrites existing records without creating duplicates.
 *
 * Also upserts the root domain itself as type = "domain" if not already present.
 *
 * Response:
 * {
 *   saved: number,      // total upserted (new + updated)
 *   domain: string
 * }
 */
router.post('/save-assets', async (req: Request, res: Response) => {
  const { domain, subdomains } = req.body as {
    domain?: string;
    subdomains?: string[];
  };

  if (!domain || typeof domain !== 'string' || domain.trim() === '') {
    res.status(400).json({ error: 'A valid "domain" field is required.' });
    return;
  }

  if (!Array.isArray(subdomains) || subdomains.length === 0) {
    res.status(400).json({ error: '"subdomains" must be a non-empty array of strings.' });
    return;
  }

  const rootDomain = domain.trim().toLowerCase();

  try {
    let saved = 0;

    // 1. Upsert the root domain itself as type "domain"
    await prisma.asset.upsert({
      where:  { hostname: rootDomain },
      update: { type: 'domain', discoveredAt: new Date() },
      create: { hostname: rootDomain, type: 'domain', isExposed: false },
    });
    saved++;

    // 2. Upsert every subdomain — batch using Promise.all for speed
    //    We chunk to avoid overwhelming the DB connection pool on very large lists
    const CHUNK_SIZE = 50;
    for (let i = 0; i < subdomains.length; i += CHUNK_SIZE) {
      const chunk = subdomains.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map((hostname: string) =>
          prisma.asset.upsert({
            where:  { hostname: hostname.trim().toLowerCase() },
            update: { type: 'subdomain', discoveredAt: new Date() },
            create: {
              hostname: hostname.trim().toLowerCase(),
              type: 'subdomain',
              isExposed: false,
            },
          })
        )
      );

      saved += chunk.length;
    }

    console.log(`[Discovery] Saved ${saved} assets for root domain: ${rootDomain}`);
    res.json({ saved, domain: rootDomain });
  } catch (error) {
    console.error('[Discovery] Error saving assets:', error);
    res.status(500).json({ error: 'Internal server error while saving assets to database.' });
  }
});

export default router;
