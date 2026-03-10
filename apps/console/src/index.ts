import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard.js';
import issueRoutes from './routes/issues.js';
import assetRoutes from './routes/assets.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/assets', assetRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'ASM Backend is running' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
