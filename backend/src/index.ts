import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import analyticsRoutes from './modules/analytics/analytics.routes';
import authRoutes from './modules/auth/auth.routes';

const app = express();
const port = 3000;

// Global middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// 📊 Analytical Engine Routes (Python)
app.use('/api/v1/analytics', analyticsRoutes);

// 🔐 Authentication Routes (Database)
app.use('/api/v1/auth', authRoutes);

app.listen(port, () => {
  console.log(`🚀 [backend]: Node.js server running at http://127.0.0.1:${port}`);
});