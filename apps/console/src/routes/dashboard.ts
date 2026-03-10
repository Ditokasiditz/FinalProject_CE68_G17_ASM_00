import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/summary', async (req: Request, res: Response) => {
    try {
        const factors = await prisma.factor.findMany({
            select: {
                title: true,
                score: true,
                issueCount: true
            }
        });

        // Calculate overall score based on the frontend logic
        const overallScore = factors.length > 0
            ? Math.round(factors.reduce((acc: number, curr: { score: number }) => acc + curr.score, 0) / factors.length)
            : 0;

        let overallGrade = 'D';
        if (overallScore >= 90) overallGrade = 'A';
        else if (overallScore >= 80) overallGrade = 'B';
        else if (overallScore >= 70) overallGrade = 'C';

        res.json({
            score: overallScore,
            grade: overallGrade,
            factors
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
