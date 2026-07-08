import { api } from './api';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface ExportPdfPayload {
  title: string;         // ✅ renamed from 'titulo'
  kpis: {
    total: number;
    maior: number;       // backend field — kept as-is
    media: number;       // backend field — kept as-is
    sufixo?: string;     // backend field — optional unit prefix
  };
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    [key: string]: any;
  }>;
  chartImage: string;    // ✅ renamed from 'graficoImg'
}

// ------------------------------------------------------------
// Service
// ------------------------------------------------------------

export const exportService = {
  /**
   * Requests a PDF report from the backend and triggers a browser download.
   * Authentication is handled automatically via the HttpOnly secure cookie
   * (no manual token retrieval required).
   */
  async downloadReportPdf(payload: ExportPdfPayload, dashboardId?: string): Promise<void> {
    // Dispatch the complete payload — including the captured chart screenshot — to the backend
    const response = await api.post(
      '/analytics/export-pdf',
      {
        titulo: payload.title,          // backend still expects 'titulo' — bridge mapping
        kpis: payload.kpis,
        labels: payload.labels,
        datasets: payload.datasets,
        graficoImg: payload.chartImage, // backend still expects 'graficoImg' — bridge mapping
      },
      {
        responseType: 'blob', // Puppeteer returns raw binary PDF data
      }
    );

    // Build an in-memory blob URL and trigger the browser download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `Report_${dashboardId || 'BatBI'}.pdf`);

    document.body.appendChild(link);
    link.click();

    // Clean up — release object URL to prevent memory leaks
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};