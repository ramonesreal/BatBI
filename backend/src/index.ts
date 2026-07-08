import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import analyticsRoutes from './modules/analytics/analytics.routes';
import authRoutes from './modules/auth/auth.routes';

const app = express();
const port = 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 📊 Rotas do Motor Analítico (Python)
app.use('/api/v1/analytics', analyticsRoutes);

// 🔐 Rotas de Autenticação (Banco de Dados)
app.use('/api/v1/auth', authRoutes);

app.listen(port, () => {
  console.log(`🚀 [backend]: Servidor Node.js rodando em http://127.0.0.1:${port}`);
});