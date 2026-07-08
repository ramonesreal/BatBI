import { api } from './api';

interface ExportPdfPayload {
  titulo: string;
  kpis: {
    total: number;
    maior: number;
    media: number;
    sufixo?: string;
  };
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    [key: string]: any;
  }>;
  graficoImg: string; // 🚀 Propriedade mantida com sucesso
}

export const exportService = {
  async baixarRelatorioPdf(payload: ExportPdfPayload, dashboardId?: string): Promise<void> {
    const token = localStorage.getItem('@BatBI:token');

    // 📡 Disparo contra o backend passando o pacote completo incluindo o print do gráfico
    const response = await api.post('/analytics/export-pdf', {
      titulo: payload.titulo,
      kpis: payload.kpis,
      labels: payload.labels,
      datasets: payload.datasets,
      graficoImg: payload.graficoImg
    }, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob', // 🔥 Crucial: Trata a resposta do Puppeteer como dados binários crus
    });

    // 📄 Criação do arquivo físico em memória no Navegador para disparo de download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `Relatorio_${dashboardId || 'BatBI'}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    // 🧹 Limpeza cirúrgica da memória para evitar vazamento de dados (Memory Leak)
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};