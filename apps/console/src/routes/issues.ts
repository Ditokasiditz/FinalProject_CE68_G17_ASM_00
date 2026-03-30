import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/issues/severity - returns distinct affected device counts grouped by severity level
router.get('/severity', async (req: Request, res: Response) => {
    try {
        // Count distinct assets (devices) affected by issues of each severity level
        const LEVELS = ['critical', 'high', 'medium', 'low'];

        const counts = await Promise.all(
            LEVELS.map(async (level) => {
                const count = await prisma.issueOnAsset.count({
                    where: {
                        issue: {
                            severity: level.charAt(0).toUpperCase() + level.slice(1),
                        },
                    },
                });
                return {
                    level: level.charAt(0).toUpperCase() + level.slice(1),
                    count,
                };
            })
        );

        res.json(counts);
    } catch (error) {
        console.error('Error fetching severity summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/issues - returns all issues with affected asset count and asset details
router.get('/', async (req: Request, res: Response) => {
    try {
        const issues = await prisma.issue.findMany({
            include: {
                assets: {
                    include: {
                        asset: {
                            select: {
                                id: true,
                                hostname: true,
                                ipAddress: true,
                                type: true,
                            }
                        }
                    }
                },
                _count: {
                    select: { assets: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const result = issues.map(issue => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            impact: issue.impact,
            factor: issue.factor,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            findingsCount: issue._count.assets,
            findings: issue.assets.map(ia => ({
                assetId: ia.asset.id,
                hostname: ia.asset.hostname,
                ipAddress: ia.asset.ipAddress,
                type: ia.asset.type,
                status: ia.status,
                lastObserved: ia.lastObserved,
            }))
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/issues/by-name/:name - returns a single issue by its title
// IMPORTANT: must be defined BEFORE /:id so Express matches it first
router.get('/by-name/:name', async (req: Request, res: Response) => {
    try {
        const title = String(req.params.name);
        
        const issue = await prisma.issue.findUnique({
            where: { title },
            include: {
                assets: {
                    include: {
                        asset: {
                            select: {
                                id: true,
                                hostname: true,
                                ipAddress: true,
                                type: true,
                                isExposed: true,
                            }
                        }
                    },
                    orderBy: { lastObserved: 'desc' }
                },
                _count: { select: { assets: true } }
            }
        });

        if (!issue) {
            res.status(404).json({ error: 'Issue not found' });
            return;
        }

        res.json({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            impact: issue.impact,
            factor: issue.factor,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            findingsCount: issue._count.assets,
            findings: issue.assets.map(ia => ({
                assetId: ia.asset.id,
                hostname: ia.asset.hostname,
                ipAddress: ia.asset.ipAddress,
                type: ia.asset.type,
                isExposed: ia.asset.isExposed,
                status: ia.status,
                lastObserved: ia.lastObserved,
                comment: ia.comment ?? null,
            }))
        });
    } catch (error) {
        console.error('Error fetching issue by name:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/issues/:id - returns a single issue with full findings for the detail page
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid issue ID' });
            return;
        }

        const issue = await prisma.issue.findUnique({
            where: { id },
            include: {
                assets: {
                    include: {
                        asset: {
                            select: {
                                id: true,
                                hostname: true,
                                ipAddress: true,
                                type: true,
                                isExposed: true,
                            }
                        }
                    },
                    orderBy: { lastObserved: 'desc' }
                },
                _count: { select: { assets: true } }
            }
        });

        if (!issue) {
            res.status(404).json({ error: 'Issue not found' });
            return;
        }

        res.json({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            severity: issue.severity,
            impact: issue.impact,
            factor: issue.factor,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            findingsCount: issue._count.assets,
            findings: issue.assets.map(ia => ({
                assetId: ia.asset.id,
                hostname: ia.asset.hostname,
                ipAddress: ia.asset.ipAddress,
                type: ia.asset.type,
                isExposed: ia.asset.isExposed,
                status: ia.status,
                lastObserved: ia.lastObserved,
                comment: ia.comment ?? null,
            }))
        });
    } catch (error) {
        console.error('Error fetching issue detail:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/issues/:issueId/findings/:assetId - save a comment on a specific finding
router.patch('/:issueId/findings/:assetId', async (req: Request, res: Response) => {
    try {
        const issueId = parseInt(String(req.params.issueId), 10);
        const assetId = parseInt(String(req.params.assetId), 10);
        const { comment } = req.body as { comment: string | null };

        if (isNaN(issueId) || isNaN(assetId)) {
            res.status(400).json({ error: 'Invalid IDs' });
            return;
        }

        const updated = await prisma.issueOnAsset.update({
            where: { issueId_assetId: { issueId, assetId } },
            data: { comment: comment ?? null },
        });

        res.json({ comment: updated.comment });
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
