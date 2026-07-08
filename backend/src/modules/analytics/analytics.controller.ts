import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';
import { RequestAutenticado } from '../auth/auth.middleware';
import { databaseService } from '../../services/databaseService';
import { pdfService } from '../../services/pdfService';

const prisma = new PrismaClient();

export const analyticsController = {
  // Inspeciona o arquivo e retorna o array de colunas disponíveis
  async inspecionarCsv(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const formData = new FormData();
      formData.append('file', req.file.buffer, { filename: req.file.originalname });

      // Envia os bytes do arquivo para a rota de inspeção rápida do Python
      const respostaPython = await axios.post('http://127.0.0.1:5000/inspecionar-csv', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Retorna diretamente o objeto { colunas: [...] } para o front-end
      return res.json(respostaPython.data);

    } catch (error: any) {
      console.error('Erro na inspeção do cabeçalho do arquivo:', error.message);
      return res.status(500).json({
        error: 'Erro interno ao tentar mapear a estrutura do arquivo CSV.'
      });
    }
  },

  async processarCsv(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      // 👤 Pegamos o ID do usuário exatamente de onde o seu middleware injeta
      const userId = req.usuarioLogado?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não identificado na sessão.' });
      }

      const eixoX = req.body.eixo_x || 'categoria';
      const eixoY = req.body.eixo_y || 'valor';
      const tipoGrafico = req.body.tipo_grafico || 'bar'; // 🎛️ Captura o tipo escolhido pelo usuário

      const formData = new FormData();
      formData.append('file', req.file.buffer, { filename: req.file.originalname });
      formData.append('eixo_x', eixoX);
      formData.append('eixo_y', eixoY);
      formData.append('tipo_grafico', tipoGrafico); // 🚀 Repassa o tipo para a engine Python

      const respostaPython = await axios.post('http://127.0.0.1:5000/processar-csv', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const dadosDoGrafico = respostaPython.data;

      // 🧮 Extrai os valores numéricos retornados pela Engine Python
      // Nota: Ajuste o caminho se a sua engine estruturar o array de dados de outra forma
      const valores = dadosDoGrafico.datasets?.[0]?.data || [];

      // Calcular os KPIs sobre os dados processados do CSV
      const totalY = valores.reduce((acc: number, val: number) => acc + val, 0);
      const maiorY = valores.length > 0 ? Math.max(...valores) : 0;
      const mediaY = valores.length > 0 ? totalY / valores.length : 0;

      // 🚀 Acopla o objeto kpis mantendo a paridade idêntica com o payload do SQL
      dadosDoGrafico.kpis = {
        total: totalY,
        maior: maiorY,
        media: mediaY,
        sufixo: eixoY.toLowerCase().includes('faturamento') || eixoY.toLowerCase().includes('valor') ? 'R$' : ''
      };

      // 🗄️ Gravação automática no banco de dados via Prisma usando o schema Dashboard
      const novoDashboardSalvo = await prisma.dashboard.create({
        data: {
          titulo: req.file.originalname, // Nome do arquivo .csv vira o título inicial
          configJson: JSON.stringify(dadosDoGrafico), // Transforma o JSON (agora com KPIs) em texto
          userId: userId, // Chave estrangeira atrelada ao usuário logado
        },
      });

      // Retorna os dados analíticos mais o ID gerado no banco de dados
      return res.json({
        ...dadosDoGrafico,
        dashboardId: novoDashboardSalvo.id
      });

    } catch (error: any) {
      console.error('Erro na comunicação com o data-engine ou banco:', error.message);
      return res.status(500).json({
        error: 'Erro interno no servidor ao tentar processar os dados analíticos.'
      });
    }
  },

  async listarHistorico(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const userId = req.usuarioLogado?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não identificado na sessão.' });
      }

      // Busca no banco todos os dashboards criados por este usuário, ordenando pelos mais recentes
      const historico = await prisma.dashboard.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          titulo: true,
          configJson: true,
          createdAt: true,
        }
      });

      // Como o configJson está salvo como string no banco, vamos transformá-lo 
      // de volta em objeto JSON real para o Front-end não ter trabalho
      const historicoFormatado = historico.map(item => ({
        id: item.id,
        titulo: item.titulo,
        createdAt: item.createdAt,
        chartData: JSON.parse(item.configJson)
      }));

      return res.json(historicoFormatado);

    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error.message);
      return res.status(500).json({
        error: 'Erro interno ao carregar o histórico de análises.'
      });
    }
  },

  // 🗑️ Deleta uma ou múltiplas análises do histórico
  async deletarHistorico(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const userId = req.usuarioLogado?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não identificado na sessão.' });
      }

      // 📥 Captura os dados garantindo que o TS saiba os formatos possíveis
      const idsDoBody = req.body.ids;
      const idDaUrl = req.params.id;

      let idsParaDeletar: string[] = [];

      // Se veio id na URL, garante que é uma string pura antes de jogar no array
      if (idDaUrl) {
        idsParaDeletar.push(typeof idDaUrl === 'string' ? idDaUrl : String(idDaUrl));
      }

      // Se vieram ids no body, garante que é um array de strings
      if (idsDoBody && Array.isArray(idsDoBody)) {
        idsParaDeletar = [...idsParaDeletar, ...idsDoBody.map(id => String(id))];
      }

      if (idsParaDeletar.length === 0) {
        return res.status(400).json({ error: 'Nenhum ID foi fornecido para exclusão.' });
      }

      // Executa a deleção em lote garantindo a segurança pelo userId
      const deletados = await prisma.dashboard.deleteMany({
        where: {
          id: { in: idsParaDeletar }, // 🔒 O Prisma aceita estritamente string[] aqui dentro de 'in'
          userId: userId
        }
      });

      return res.json({
        success: true,
        message: `${deletados.count} análise(s) removida(s) com sucesso.`
      });

    } catch (error: any) {
      console.error('Erro ao deletar histórico:', error.message);
      return res.status(500).json({
        error: 'Erro interno ao tentar remover itens do banco.'
      });
    }
  },

  // 🔗 POST /analytics/db-test
  async testarConexaoBanco(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name } = req.body;

      if (!host || !port || !user || !pass || !name) {
        return res.status(400).json({ error: 'Todos os campos de credenciais são obrigatórios.' });
      }

      const conectado = await databaseService.testarConexao({
        host,
        port: Number(port),
        user,
        pass,
        name
      });

      if (!conectado) {
        return res.status(400).json({ success: false, error: 'Não foi possível estabelecer conexão. Verifique os dados e o firewall.' });
      }

      // 🚀 Já busca e retorna as tabelas para alimentar o front-end imediatamente
      const tabelas = await databaseService.listarTabelas({
        host,
        port: Number(port),
        user,
        pass,
        name
      });

      return res.json({
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        tabelas
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno ao validar banco de dados.' });
    }
  },

  // 🗂️ POST /analytics/db-tables
  async obterTabelasBanco(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name } = req.body;

      const tabelas = await databaseService.listarTabelas({
        host,
        port: Number(port),
        user,
        pass,
        name
      });

      return res.json({ success: true, tabelas });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // 📊 POST /analytics/db-columns
  async obterColunasBanco(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name, tabela } = req.body;

      if (!tabela) {
        return res.status(400).json({ error: 'É necessário informar a tabela para mapeamento.' });
      }

      const colunas = await databaseService.obterColunasTabela({
        host,
        port: Number(port),
        user,
        pass,
        name
      }, tabela);

      return res.json({ success: true, colunas });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  // ⚡ POST /analytics/query
  async processarQueryBanco(req: RequestAutenticado, res: Response): Promise<any> {
    try {
      const userId = req.usuarioLogado?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não identificado na sessão.' });
      }

      const { host, port, user, pass, name, tabela, eixo_x, eixo_y, tipo_grafico } = req.body;

      if (!tabela || !eixo_x || !eixo_y || !tipo_grafico) {
        return res.status(400).json({ error: 'Parâmetros de mapeamento ausentes.' });
      }

      // 1. Busca os dados agregados do banco externo do cliente
      const dadosAgregados = await databaseService.rodarQueryAnalitica({
        host,
        port: Number(port),
        user,
        pass,
        name
      }, tabela, eixo_x, eixo_y);

      const labels = dadosAgregados.map(d => d.label);
      const valores = dadosAgregados.map(d => d.valor);

      // 🧮 Cálculo Dinâmico dos KPIs para o Banco de Dados
      const totalY = valores.reduce((acc, val) => acc + val, 0);
      const maiorY = valores.length > 0 ? Math.max(...valores) : 0;
      const mediaY = valores.length > 0 ? totalY / valores.length : 0;

      const chartData = {
        labels,
        datasets: [
          {
            label: `${eixo_y} por ${eixo_x}`,
            data: valores,
            backgroundColor: tipo_grafico === 'line' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.8)',
            borderColor: '#eab308',
            borderWidth: 2,
          }
        ],
        tipo: tipo_grafico,
        // 🚀 Injeta os indicadores estruturados no payload
        kpis: {
          total: totalY,
          maior: maiorY,
          media: mediaY,
          sufixo: eixo_y.toLowerCase().includes('faturamento') || eixo_y.toLowerCase().includes('valor') ? 'R$' : ''
        }
      };

      const novaAnalise = await prisma.dashboard.create({
        data: {
          userId: userId,
          titulo: `SQL: ${tabela} [${eixo_y} x ${eixo_x}]`,
          configJson: JSON.stringify(chartData)
        }
      });

      return res.json({
        dashboardId: novaAnalise.id,
        ...chartData
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  },

  async exportarPdf(req: Request, res: Response): Promise<any> {
    try {
      // 🚀 Captura o 'graficoImg' vindo do payload do Front-end
      const { titulo, kpis, labels, datasets, graficoImg } = req.body;

      if (!kpis || !labels || !datasets?.[0]?.data || !graficoImg) {
        return res.status(400).json({ error: 'Dados insuficientes (incluindo o gráfico capturado) para gerar o relatório.' });
      }

      const valores = datasets[0].data;

      // 📡 Dispara o serviço do Puppeteer repassando o Base64 do gráfico Recharts
      const pdfBuffer = await pdfService.gerarRelatorioDashboard({
        titulo: titulo || 'Analise_BatBI',
        kpis,
        labels,
        valores,
        graficoImg // 🔥 Passado com sucesso para o template HTML do Puppeteer
      });

      // Configura os headers HTTP para forçar o navegador a entender que é um download de arquivo
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Relatorio_BatBI.pdf`);

      return res.end(pdfBuffer);

    } catch (error: any) {
      console.error('Erro ao gerar exportação em PDF:', error.message);
      return res.status(500).json({ error: 'Falha interna ao processar arquivo PDF.' });
    }
  }
};