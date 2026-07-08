import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// Interface para estender o Request do Express e permitir guardar o usuário logado dentro dele
export interface RequestAutenticado extends Request {
  usuarioLogado?: {
    id: string;
    email: string;
  };
}

export const autenticacaoMiddleware = (
  req: RequestAutenticado,
  res: Response,
  next: NextFunction
): any => {
  // 1. Pega o cabeçalho 'Authorization' da requisição
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido. Acesso negado.' });
  }

  // O padrão de envio do token é "Bearer <TOKEN>". Vamos separar a palavra 'Bearer' do token real.
  const partes = authHeader.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token malformatado. Acesso negado.' });
  }

  const token = partes[1];

  try {
    // 2. Valida o token com a nossa chave secreta do .env
    const verificado = jwt.verify(token, env.jwtSecret) as { id: string; email: string };

    // 3. Se deu certo, salva os dados do usuário dentro da 'req' para as próximas funções saberem quem ele é
    req.usuarioLogado = { id: verificado.id, email: verificado.email };

    return next();

  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};