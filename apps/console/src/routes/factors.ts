import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/factors - returns all factors with aggregated issues and findings
router.get('/', async (req: Request, res: Response) => {
    try {
        const factors = await prisma.factor.findMany({
            orderBy: { id: 'asc' }
        });

        const issues = await prisma.issue.findMany({
            include: {
                _count: {
                    select: { assets: true }
                }
            }
        });

        const result = factors.map(factor => {
            const factorIssues = issues.filter(
                issue => issue.factor === factor.title && issue._count.assets > 0
            );
            
            const severityCounts = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            };
            
            let totalFindings = 0;
            let totalImpact = 0;

            const nestedIssues = factorIssues.map(issue => {
                return {
                    id: issue.id,
                    title: issue.title,
                    severity: issue.severity,
                    impact: issue.impact ?? 0,
                    findingsCount: issue._count.assets
                };
            });

            factorIssues.forEach(issue => {
                if (issue.severity === 'Critical') severityCounts.critical += 1;
                else if (issue.severity === 'High') severityCounts.high += 1;
                else if (issue.severity === 'Medium') severityCounts.medium += 1;
                else if (issue.severity === 'Low') severityCounts.low += 1;
                
                totalFindings += issue._count.assets;
                totalImpact += (issue.impact ?? 0) * issue._count.assets;
            });

            return {
                id: factor.id,
                title: factor.title,
                score: factor.score,
                impact: Number(totalImpact.toFixed(1)),
                issues: {
                    critical: severityCounts.critical,
                    high: severityCounts.high,
                    medium: severityCounts.medium,
                    low: severityCounts.low
                },
                findingsCount: totalFindings,
                nestedIssues: nestedIssues
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching factors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
