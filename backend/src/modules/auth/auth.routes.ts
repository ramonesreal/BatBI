import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';

const authRoutes = Router();

// 🔒 Configuração do porteiro de segurança para o cadastro
const criacaoContaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // Janela de 1 hora
  max: 5, // Limite de 5 cadastros por IP por hora
  message: { error: 'Muitas contas criadas a partir deste IP. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rota de Cadastro
authRoutes.post('/cadastro', criacaoContaLimiter, authController.cadastro);

// Rota de Login
authRoutes.post('/login', authController.login);

export default authRoutes;