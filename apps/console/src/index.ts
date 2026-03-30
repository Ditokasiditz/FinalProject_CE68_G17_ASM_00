import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard.js';
import issueRoutes from './routes/issues.js';
import assetRoutes from './routes/assets.js';
import factorRoutes from './routes/factors.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import discoveryRoutes from './routes/discovery.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Allow local dev, explicit CORS_ORIGIN env var, and any Vercel deployment URL
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl/Postman
    // Allow exact match OR any *.vercel.app subdomain (covers preview + production deployments)
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-zA-Z0-9-]+(\.vercel\.app)$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' })); // Increased limit to allow base64 image uploads

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/factors', factorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discovery', discoveryRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'ASM Backend is running' });
});

// Only start HTTP server in local dev (not in serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
