import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { getHostInfo } from '../lib/shodan.js';

const router = Router();
const prisma = new PrismaClient();

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

router.post('/refresh-all', async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            where: { ipAddress: { not: null } }
        });

        const results = [];
        for (const asset of assets) {
            if (!asset.ipAddress) continue;
            
            try {
                const shodanInfo = await getHostInfo(asset.ipAddress);
                const updated = await prisma.asset.update({
                    where: { id: asset.id },
                    data: {
                        city: shodanInfo?.city || 'Not Found',
                        country: shodanInfo?.country_name || null,
                        countryCode: shodanInfo?.country_code || null,
                        latitude: shodanInfo?.latitude || null,
                        longitude: shodanInfo?.longitude || null,
                    }
                });
                results.push({ id: asset.id, status: shodanInfo ? 'success' : 'not_found' });
            } catch (err) {
                console.error(`Error refreshing asset ${asset.id}:`, err);
                results.push({ id: asset.id, status: 'error' });
            }
            
            // Subtle delay to avoid rate limiting if there are many assets
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        res.json({ message: 'Sync complete', results });
    } catch (error) {
        console.error('Error in refresh-all:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/refresh', async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const assetId = id as string;
        const asset = await prisma.asset.findUnique({
            where: { id: parseInt(assetId) }
        });

        if (!asset || !asset.ipAddress) {
            return res.status(404).json({ error: 'Asset not found or has no IP address' });
        }

        const shodanInfo = await getHostInfo(asset.ipAddress);

        const updatedAsset = await prisma.asset.update({
            where: { id: parseInt(assetId) },
            data: {
                city: shodanInfo?.city || 'Not Found',
                country: shodanInfo?.country_name || null,
                countryCode: shodanInfo?.country_code || null,
                latitude: shodanInfo?.latitude || null,
                longitude: shodanInfo?.longitude || null,
            }
        });

        res.json(updatedAsset);
    } catch (error) {
        console.error('Error refreshing asset from Shodan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
