import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../database'; // Puxa nossa conexão central do Prisma
import { env } from '../../config/env';

export const authController = {
  // 1. ROTA DE CADASTRO (SIGNUP)
  async cadastro(req: Request, res: Response): Promise<any> {
    try {
      const { nome, email, senha } = req.body;

      // Validação básica de campos obrigatórios
      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
      }

      // Verifica se o e-mail já está cadastrado no banco do Neon
      const usuarioExiste = await prisma.user.findUnique({ where: { email } });
      if (usuarioExiste) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      // Criptografia: Embaralha a senha usando um salt de 10 rounds
      const senhaCriptografada = await bcrypt.hash(senha, 10);

      // Salva o novo usuário fisicamente no banco de dados
      const novoUsuario = await prisma.user.create({
        data: {
          nome,
          email,
          senha: senhaCriptografada,
        },
      });

      // Retorna sucesso sem expor a senha hash por segurança
      return res.status(201).json({
        message: 'Usuário criado com sucesso!',
        user: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
      });

    } catch (error: any) {
      console.error('Erro no cadastro:', error.message);
      return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
    }
  },
  // 2. ROTA DE LOGIN (SIGNIN)
  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, senha } = req.body;

      // Validação de campos
      if (!email || !senha) {
        return res.status(400).json({ error: 'Por favor, informe o e-mail e a senha.' });
      }

      // 1. Busca o usuário pelo e-mail
      const usuario = await prisma.user.findUnique({ where: { email } });
      if (!usuario) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // 2. Compara a senha digitada com a criptografada no banco
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // 3. Gera o Token JWT contendo o ID e o E-mail do usuário, durando 1 dia
      const token = jwt.sign(
        { id: usuario.id },
        env.jwtSecret,
        { expiresIn: '1d' }
      );

      // 4. Retorna o token de acesso e os dados básicos do usuário logado
      return res.json({
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      });

    } catch (error: any) {
      console.error('Erro no login:', error.message);
      return res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    }
  }
};