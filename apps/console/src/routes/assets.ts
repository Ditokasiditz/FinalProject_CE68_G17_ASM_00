import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

export default router;
