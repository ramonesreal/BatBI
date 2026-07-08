// analytics.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../auth/auth.middleware';

const analyticsRoutes = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Inspects the uploaded file and returns columns for <select> elements
analyticsRoutes.post(
  '/inspect',
  authMiddleware,
  upload.single('file'),
  analyticsController.inspectCsv
);

// Processes axes and generates the final chart
analyticsRoutes.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  analyticsController.processCsv
);

// List user's analysis history
analyticsRoutes.get(
  '/history',
  authMiddleware,
  analyticsController.listHistory
);

// Handles deleting all history or a specific item by ID
analyticsRoutes.delete(
  '/history', // For deleting all history (with query param 'all=true')
  authMiddleware,
  analyticsController.deleteHistory
);

analyticsRoutes.delete(
  '/history/:id', // For deleting a specific history item by ID
  authMiddleware,
  analyticsController.deleteHistory
);

// Tests a database connection
analyticsRoutes.post(
  '/db-test',
  authMiddleware,
  analyticsController.testDatabaseConnection
);

// Retrieves database tables
analyticsRoutes.post(
  '/db-tables',
  authMiddleware,
  analyticsController.getDatabaseTables
);

// Retrieves columns for a specific database table
analyticsRoutes.post(
  '/db-columns',
  authMiddleware,
  analyticsController.getDatabaseColumns
);

// Processes a database query and returns chart data
analyticsRoutes.post(
  '/query',
  authMiddleware,
  analyticsController.processDatabaseQuery
);

// Exports the dashboard as a PDF report
analyticsRoutes.post(
  '/export-pdf',
  authMiddleware,
  analyticsController.exportPdf
);

export default analyticsRoutes;