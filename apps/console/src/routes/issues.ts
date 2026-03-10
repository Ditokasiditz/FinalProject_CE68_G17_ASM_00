import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
    try {
        const issues = await prisma.issue.findMany({
            include: {
                asset: {
                    select: {
                        hostname: true,
                        ipAddress: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
