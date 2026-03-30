import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { getHostInfo, getDomainInfo, resolveHostname } from '../lib/shodan.js';

const router = Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: resolve geo + IP for a single asset using the correct Shodan path.
//   - If the asset already has an ipAddress → use getHostInfo(ip)
//   - If it only has a hostname        → use getDomainInfo(hostname) to get
//     the first A record, then getHostInfo(resolvedIp) for full geo.
// Returns an object ready to spread into prisma.asset.update({ data: … })
// ---------------------------------------------------------------------------
async function enrichAsset(asset: { id: number; ipAddress: string | null; hostname: string }) {
    let resolvedIp: string | null = asset.ipAddress ?? null;

    // ── Path A: IP already known ──────────────────────────────────────────
    if (resolvedIp) {
        const info = await getHostInfo(resolvedIp);
        return {
            city:        info?.city         ?? 'Not Found',
            country:     info?.country_name ?? null,
            countryCode: info?.country_code ?? null,
            latitude:    info?.latitude     ?? null,
            longitude:   info?.longitude    ?? null,
        };
    }

    // ── Path B: No IP — resolve via Shodan DNS resolve ─────────────
    resolvedIp = await resolveHostname(asset.hostname);

    if (!resolvedIp) {
        // Domain could not be resolved to an IP
        console.warn(`[Shodan] Could not resolve IP for hostname: ${asset.hostname}`);
        return {
            city: 'Not Found',
            country: null,
            countryCode: null,
            latitude: null,
            longitude: null,
        };
    }

    // Now get full geo info using the resolved IP
    const hostInfo = await getHostInfo(resolvedIp);

    return {
        ipAddress:   resolvedIp,                        // persist the resolved IP
        city:        hostInfo?.city         ?? 'Not Found',
        country:     hostInfo?.country_name ?? null,
        countryCode: hostInfo?.country_code ?? null,
        latitude:    hostInfo?.latitude     ?? null,
        longitude:   hostInfo?.longitude    ?? null,
    };
}

// ---------------------------------------------------------------------------
// GET /api/assets — return all assets with issue counts
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                _count: {
                    select: { issues: true }
                }
            },
            orderBy: {
                discoveredAt: 'desc'
            }
        });
        res.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/assets/refresh-all
// Syncs every asset with Shodan:
//   • Asset has IP       → getHostInfo(ip)        to get geo
//   • Asset has no IP    → getDomainInfo(hostname) to resolve IP, then geo
// ---------------------------------------------------------------------------
router.post('/refresh-all', async (req: Request, res: Response) => {
    try {
        // Fetch ALL assets (not just those with an IP)
        const assets = await prisma.asset.findMany();

        const results = [];

        for (const asset of assets) {
            try {
                const updateData = await enrichAsset(asset);

                await prisma.asset.update({
                    where: { id: asset.id },
                    data:  updateData,
                });

                results.push({
                    id:       asset.id,
                    hostname: asset.hostname,
                    status:   updateData.city !== 'Not Found' ? 'success' : 'not_found',
                    method:   asset.ipAddress ? 'ip' : 'domain_dns',
                });
            } catch (err) {
                console.error(`Error refreshing asset ${asset.id} (${asset.hostname}):`, err);
                results.push({ id: asset.id, hostname: asset.hostname, status: 'error' });
            }

            // Small delay between each asset to respect Shodan rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        res.json({ message: 'Sync complete', results });
    } catch (error) {
        console.error('Error in refresh-all:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/assets/:id/refresh
// Syncs a single asset — works with or without an existing IP address.
// ---------------------------------------------------------------------------
router.post('/:id/refresh', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const asset = await prisma.asset.findUnique({
            where: { id: parseInt(String(id)) }
        });

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Both paths handled by the shared helper
        const updateData = await enrichAsset(asset);

        const updatedAsset = await prisma.asset.update({
            where: { id: parseInt(String(id)) },
            data:  updateData,
        });

        res.json(updatedAsset);
    } catch (error) {
        console.error('Error refreshing asset from Shodan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
