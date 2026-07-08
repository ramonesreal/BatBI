// analytics.controller.ts
import { Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import prisma from '../../database';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { databaseService } from '../../services/databaseService';
import { pdfService } from '../../services/pdfService';

export const analyticsController = {
  /**
   * Inspects the uploaded CSV file and returns the array of available columns.
   * This is typically used to populate <select> elements in the frontend.
   * @param req The authenticated request object with an uploaded file.
   * @param res The response object.
   * @returns A JSON response containing the available columns or an error.
   */
  async inspectCsv(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const formData = new FormData();
      formData.append('file', req.file.buffer, { filename: req.file.originalname });

      // Sends the file bytes to Python's quick inspection route
      const pythonResponse = await axios.post('http://127.0.0.1:5000/inspect-csv', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Returns the response from python engine
      return res.json(pythonResponse.data);

    } catch (error: any) {
      console.error('Error communicating with data-engine during CSV inspection:', error.message);
      return res.status(500).json({
        error: 'Internal server error when trying to inspect analytical data.',
      });
    }
  },

  /**
   * Processes the uploaded CSV file based on X and Y axis selections and chart type.
   * Generates chart data, calculates KPIs, and saves the dashboard configuration.
   * @param req The authenticated request object with file and chart configuration.
   * @param res The response object.
   * @returns A JSON response containing the chart data, KPIs, and dashboard ID or an error.
   */
  async processCsv(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      // Support both English and Portuguese parameter structures from request body/form
      const xAxis = req.body.xAxis || req.body.eixo_x;
      const yAxis = req.body.yAxis || req.body.eixo_y;
      const chartType = req.body.chartType || req.body.tipo_grafico || 'bar';

      if (!xAxis || !yAxis) {
        return res.status(400).json({ error: 'Axis parameters (xAxis/yAxis) are required.' });
      }

      const formData = new FormData();
      formData.append('file', req.file.buffer, { filename: req.file.originalname });
      formData.append('xAxis', xAxis);
      formData.append('yAxis', yAxis);
      formData.append('chartType', chartType);

      // Sends the file bytes and chart configuration to the Python data-engine for processing
      const pythonResponse = await axios.post('http://127.0.0.1:5000/process-csv', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const chartData = pythonResponse.data;

      // Extract values to calculate KPIs
      const values = chartData.datasets?.[0]?.data || [];

      // Calculate KPIs over the processed CSV data
      const totalY = values.reduce((acc: number, val: number) => acc + val, 0);
      const maxY = values.length > 0 ? Math.max(...values) : 0;
      const averageY = values.length > 0 ? totalY / values.length : 0;

      // 🚀 Attach the KPIs object
      chartData.kpis = {
        total: totalY,
        max: maxY,
        average: averageY,
        suffix: yAxis.toLowerCase().includes('revenue') || yAxis.toLowerCase().includes('value') || yAxis.toLowerCase().includes('faturamento') || yAxis.toLowerCase().includes('valor') ? '$' : ''
      };

      // 🗄️ Save the dashboard to database
      const newDashboardSaved = await prisma.dashboard.create({
        data: {
          titulo: req.file.originalname,
          configJson: JSON.stringify(chartData),
          userId: userId,
        },
      });

      return res.json({
        ...chartData,
        dashboardId: newDashboardSaved.id
      });

    } catch (error: any) {
      console.error('Error communicating with data-engine during CSV processing:', error.message);
      return res.status(500).json({
        error: 'Internal server error when trying to process analytical data.',
      });
    }
  },

  /**
   * Lists the user's dashboard history.
   * @param req The authenticated request object.
   * @param res The response object.
   * @returns A JSON response containing the list of dashboards or an error.
   */
  async listHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
      const userDashboards = await prisma.dashboard.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Parse the configuration JSON back to object for the frontend
      const formattedHistory = userDashboards.map(item => ({
        id: item.id,
        titulo: item.titulo,
        createdAt: item.createdAt,
        chartData: JSON.parse(item.configJson)
      }));

      return res.json(formattedHistory);
    } catch (error: any) {
      console.error('Error listing dashboard history:', error.message);
      return res.status(500).json({ error: 'Internal server error listing history.' });
    }
  },

  /**
   * Deletes dashboard history, either a specific item by ID or all history for the user.
   * @param req The authenticated request object with ID in params or query indicator.
   * @param res The response object.
   * @returns A success message or an error.
   */
  async deleteHistory(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { id } = req.params;
    const { all } = req.query;

    const { ids } = req.body || {};

    try {
      if (id && id !== 'undefined' && id !== '') {
        const dashboard = await prisma.dashboard.findFirst({
          where: { id: String(id), userId }
        });

        if (!dashboard) {
          return res.status(404).json({ error: 'Dashboard not found or unauthorized.' });
        }

        await prisma.dashboard.delete({
          where: { id: String(id) }
        });

        return res.status(200).json({ message: 'History item deleted successfully.' });
      }

      if (all === 'true') {
        await prisma.dashboard.deleteMany({
          where: { userId },
        });
        return res.status(200).json({ message: 'All history deleted successfully.' });
      }

      if (ids && Array.isArray(ids) && ids.length > 0) {
        await prisma.dashboard.deleteMany({
          where: {
            userId,
            id: { in: ids.map(String) }
          }
        });
        return res.status(200).json({ message: 'Selected history items deleted successfully.' });
      }

      return res.status(400).json({ error: 'Invalid request. Missing targeted ID or ID list.' });

    } catch (error: any) {
      console.error('Error deleting dashboard history:', error.message);
      return res.status(500).json({ error: 'Internal server error deleting history.' });
    }
  },

  /**
   * Tests a database connection and returns tables to make database configuration easier for users.
   * @param req The authenticated request object with database configuration in the body.
   * @param res The response object.
   * @returns A JSON response indicating connection success and available tables.
   */
  async testDatabaseConnection(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name } = req.body;

      if (!host || !port || !user || !pass || !name) {
        return res.status(400).json({ error: 'Missing database connection parameters.' });
      }

      const dbConfig = { host, port: Number(port), user, pass, name };
      const isConnected = await databaseService.testConnection(dbConfig);

      if (!isConnected) {
        return res.status(400).json({ error: 'Could not establish connection to the database.' });
      }

      // If connection succeeds, retrieve table list for user convenience
      const tables = await databaseService.listTables(dbConfig);

      return res.json({
        message: 'Connection established successfully!',
        tabelas: tables // Matches frontend expectations
      });
    } catch (error: any) {
      console.error('Error testing database connection:', error.message);
      return res.status(500).json({ error: 'Internal server error testing database connection.' });
    }
  },

  /**
   * Retrieves tables from a database using provided configuration.
   * @param req The authenticated request object with database configuration in the body.
   * @param res The response object.
   * @returns A JSON response containing database tables or an error.
   */
  async getDatabaseTables(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name } = req.body;
      const dbConfig = { host, port: Number(port), user, pass, name };

      const tables = await databaseService.listTables(dbConfig);
      return res.json({ success: true, tables });
    } catch (error: any) {
      console.error('Error getting database tables:', error.message);
      return res.status(500).json({ error: 'Internal server error getting database tables.' });
    }
  },

  /**
   * Retrieves columns for a specific table from a database using provided configuration.
   * @param req The authenticated request object with database configuration and table name in the body.
   * @param res The response object.
   * @returns A JSON response containing table columns or an error.
   */
  async getDatabaseColumns(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { host, port, user, pass, name, tabela, tableName } = req.body;
      const targetTable = tableName || tabela;

      if (!targetTable) {
        return res.status(400).json({ error: 'Table name is required.' });
      }

      const dbConfig = { host, port: Number(port), user, pass, name };
      const columns = await databaseService.getColumnsFromTable(dbConfig, targetTable);

      return res.json({ success: true, colunas: columns }); // Mapped to 'colunas' for frontend
    } catch (error: any) {
      console.error('Error getting database columns:', error.message);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Processes a database query using provided configuration and chart parameters.
   * @param req The authenticated request object with database configuration, query, and chart parameters.
   * @param res The response object.
   * @returns A JSON response containing processed query results and KPIs or an error.
   */
  async processDatabaseQuery(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    try {
      const { host, port, user, pass, name, tabela, tableName, eixo_x, eixo_y, xAxis, yAxis, tipo_grafico, chartType } = req.body;

      const targetTable = tableName || tabela;
      const targetX = xAxis || eixo_x;
      const targetY = yAxis || eixo_y;
      const targetChartType = chartType || tipo_grafico || 'bar';

      if (!targetTable || !targetX || !targetY) {
        return res.status(400).json({ error: 'Missing mapping parameters (table, xAxis, yAxis).' });
      }

      const dbConfig = { host, port: Number(port), user, pass, name };
      const aggregatedData = await databaseService.runAnalyticalQuery(dbConfig, targetTable, targetX, targetY);

      const labels = aggregatedData.map(d => d.label);
      const values = aggregatedData.map(d => d.value);

      // Calculate KPIs
      const totalY = values.reduce((acc, val) => acc + val, 0);
      const maxY = values.length > 0 ? Math.max(...values) : 0;
      const averageY = values.length > 0 ? totalY / values.length : 0;

      const chartData = {
        labels,
        datasets: [
          {
            label: `${targetY} by ${targetX}`,
            data: values,
            backgroundColor: targetChartType === 'line' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.8)',
            borderColor: '#eab308',
            borderWidth: 2,
          }
        ],
        type: targetChartType,
        kpis: {
          total: totalY,
          max: maxY,
          average: averageY,
          suffix: targetY.toLowerCase().includes('revenue') || targetY.toLowerCase().includes('value') || targetY.toLowerCase().includes('faturamento') || targetY.toLowerCase().includes('valor') ? '$' : ''
        }
      };

      // Save analytics snapshot to history
      const newAnalysis = await prisma.dashboard.create({
        data: {
          userId: userId,
          titulo: `SQL: ${targetTable} [${targetY} x ${targetX}]`,
          configJson: JSON.stringify(chartData)
        }
      });

      return res.json({
        dashboardId: newAnalysis.id,
        ...chartData
      });

    } catch (error: any) {
      console.error('Error processing database query:', error.message);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Exports a dashboard report as a PDF.
   * @param req The authenticated request object with chart data for PDF generation.
   * @param res The response object.
   * @returns A PDF file buffer as a response or an error.
   */
  async exportPdf(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      // support both English and Portuguese parameter structures from request body
      const { title, titulo, kpis, labels, datasets, chartImg, graficoImg } = req.body;
      const targetTitle = title || titulo || 'BatBI_Analysis';
      const targetChartImg = chartImg || graficoImg;

      if (!kpis || !labels || !datasets?.[0]?.data || !targetChartImg) {
        return res.status(400).json({ error: 'Insufficient data to generate the report.' });
      }

      const values = datasets[0].data;

      // 📡 Triggers the Puppeteer service by passing the Recharts chart Base64 image
      const pdfBuffer = await pdfService.generateDashboardReport({
        title: targetTitle,
        kpis: {
          total: kpis.total || kpis.total || 0,
          max: kpis.max || kpis.maior || 0,
          average: kpis.average || kpis.media || 0,
          suffix: kpis.suffix || kpis.sufixo
        },
        labels,
        values,
        chartImg: targetChartImg
      });

      // Sets HTTP headers to force the browser to understand it's a file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=BatBI_Report.pdf`);

      return res.end(pdfBuffer);

    } catch (error: any) {
      console.error('Error generating PDF export:', error.message);
      return res.status(500).json({ error: 'Internal failure processing PDF file.' });
    }
  }
};