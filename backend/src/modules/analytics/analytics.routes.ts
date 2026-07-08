import { Router } from 'express';
import multer from 'multer';
import { analyticsController } from './analytics.controller';
import { autenticacaoMiddleware } from '../auth/auth.middleware';

const analyticsRoutes = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Inspeciona o arquivo e retorna as colunas para os <select>
analyticsRoutes.post(
  '/inspect',
  autenticacaoMiddleware,
  upload.single('file'),
  analyticsController.inspecionarCsv
);

// Processa os eixos e gera o gráfico final
analyticsRoutes.post(
  '/upload', 
  autenticacaoMiddleware, 
  upload.single('file'), 
  analyticsController.processarCsv
);

// Listar histórico de análises do usuário
analyticsRoutes.get(
  '/history', 
  autenticacaoMiddleware, 
  analyticsController.listarHistorico
);

analyticsRoutes.delete(
  '/history',
  autenticacaoMiddleware,
  analyticsController.deletarHistorico
);

analyticsRoutes.delete(
  '/history/:id',
  autenticacaoMiddleware,
  analyticsController.deletarHistorico
);

analyticsRoutes.post(
  '/db-test',
  autenticacaoMiddleware,
  analyticsController.testarConexaoBanco
);

analyticsRoutes.post(
  '/db-tables',
  autenticacaoMiddleware,
  analyticsController.obterTabelasBanco
);

analyticsRoutes.post(
  '/db-columns',
  autenticacaoMiddleware,
  analyticsController.obterColunasBanco
);

analyticsRoutes.post(
  '/query',
  autenticacaoMiddleware,
  analyticsController.processarQueryBanco
);

analyticsRoutes.post(
  '/export-pdf',
  autenticacaoMiddleware,
  analyticsController.exportarPdf
);

export default analyticsRoutes;