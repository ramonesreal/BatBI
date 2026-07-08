import { useState, useEffect, useRef } from 'react'; // 🚀 Adicionado useRef
import { toPng } from 'html-to-image'; // 🚀 Importado capturador de elementos DOM
import Layout from '../../components/Layout';
import UploadZone from '../../components/UploadZone';
import DashboardChart from '../../components/DashboardChart';
import SqlForm from '../../components/SqlForm';
import CsvMappingForm from '../../components/CsvMappingForm';
import HistorySidebar from '../../components/HistorySidebar';
import { KpiCards } from '../../components/KpiCards';
import { api } from '../../services/api';
import { exportService } from '../../services/exportService';

interface HistoricoItem {
  id: string;
  titulo: string;
  createdAt: string;
  chartData: any;
}

export default function Dashboard() {
  const [uploading, setUploading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [chartData, setChartData] = useState<any>(null);
  const [origemDados, setOrigemDados] = useState<'file' | 'sql'>('file');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tabelaAtiva, setTabelaAtiva] = useState<string | null>(null);
  const [dbConfigAtivo, setDbConfigAtivo] = useState<any>(null);
  const [colunas, setColunas] = useState<string[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const areaDoGraficoRef = useRef<HTMLDivElement>(null); // 🚀 Referência magnética para "fotografar" o canvas

  const tokenHeaders = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('@BatBI:token')}` } });

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/analytics/history', tokenHeaders());
      const historicoFormatado = response.data.map((item: any) => ({
        ...item,
        chartData: typeof item.chartData === 'string' ? JSON.parse(item.chartData) : item.chartData
      }));
      setHistorico(historicoFormatado);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { carregarHistorico(); }, []);

  const handleTestarConexao = async (dbConfig: any) => {
    setLoadingDb(true); setErro(''); setSucesso('');
    try {
      const response = await api.post('/analytics/db-test', dbConfig, tokenHeaders());
      setSucesso(response.data.message || 'Conexão estabelecida com sucesso!');
      return response.data.tabelas || [];
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao tentar conectar ao banco externo.');
    } finally { setLoadingDb(false); }
  };

  const handleMapearColunas = async (dbConfig: any, tabelaSelecionada: string) => {
    setErro(''); setSucesso('');
    try {
      const response = await api.post('/analytics/db-columns', { ...dbConfig, tabela: tabelaSelecionada }, tokenHeaders());
      setColunas(response.data.colunas || []);
      setTabelaAtiva(tabelaSelecionada);
      setDbConfigAtivo(dbConfig);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Não foi possível ler as colunas desta tabela.');
    }
  };

  const handleDeletarItem = async (id: string) => {
    if (!confirm('Deseja realmente apagar esta análise do seu histórico?')) return;
    try {
      await api.delete(`/analytics/history/${id}`, tokenHeaders());
      if (chartData?.dashboardId === id) setChartData(null);
      setSucesso('Análise removida.'); carregarHistorico();
    } catch { setErro('Não foi possível remover o item.'); }
  };

  const handleDeletarEmLote = async (ids: string[]) => {
    if (!confirm(`Deseja apagar as ${ids.length} análises?`)) return;
    try {
      await api.delete('/analytics/history', { data: { ids }, ...tokenHeaders() });
      if (chartData && ids.includes(chartData.dashboardId)) setChartData(null);
      setSucesso('Análises limpas.'); carregarHistorico();
    } catch { setErro('Falha ao remover lote.'); }
  };

  const handleFileChange = async (file: File) => {
    setInspecting(true); setErro(''); setSucesso(''); setChartData(null);
    const formData = new FormData(); formData.append('file', file);
    try {
      const response = await api.post('/analytics/inspect', formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...tokenHeaders().headers }
      });
      setColunas(response.data.colunas || []); setSelectedFile(file);
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Erro ao ler colunas do CSV.'); setSelectedFile(null);
    } finally { setInspecting(false); }
  };

  const handleProcessData = async (config: { eixoX: string; eixoY: string; tipoGrafico: string }) => {
    setUploading(true); setErro(''); setSucesso('');

    try {
      if (origemDados === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('eixo_x', config.eixoX);
        formData.append('eixo_y', config.eixoY);
        formData.append('tipo_grafico', config.tipoGrafico);

        const response = await api.post('/analytics/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data', ...tokenHeaders().headers }
        });
        setChartData(response.data); setSelectedFile(null);
      } else if (origemDados === 'sql' && dbConfigAtivo && tabelaAtiva) {
        const payload = {
          ...dbConfigAtivo,
          tabela: tabelaAtiva,
          eixo_x: config.eixoX,
          eixo_y: config.eixoY,
          tipo_grafico: config.tipoGrafico
        };
        const response = await api.post('/analytics/query', payload, tokenHeaders());
        setChartData(response.data); setTabelaAtiva(null);
      }
      carregarHistorico();
    } catch (err: any) {
      setErro(err.response?.data?.error || 'Falha ao processar os dados analíticos.');
    } finally { setUploading(false); }
  };

  const [exportandoPdf, setExportandoPdf] = useState(false);

  const handleExportarPdf = async () => {
    if (!chartData || !areaDoGraficoRef.current) return;

    setExportandoPdf(true);
    setErro('');
    setSucesso('');

    try {
      // 📸 Extrai instantaneamente o print em Base64 do container do Recharts
      const graficoBase64 = await toPng(areaDoGraficoRef.current, {
        backgroundColor: '#020617', // Força a cor slate-950 de fundo clássica do BatBI
        style: { padding: '12px' }
      });

      // 🚀 Passa o Base64 gerado diretamente no payload do serviço modular
      await exportService.baixarRelatorioPdf({
        titulo: chartData.datasets?.[0]?.label || 'Analise_BatBI',
        kpis: chartData.kpis,
        labels: chartData.labels,
        datasets: chartData.datasets,
        graficoImg: graficoBase64 // 🔥 Injeção dinâmica da imagem tratada
      }, chartData.dashboardId);

      setSucesso('Relatório em PDF exportado com sucesso!');
    } catch (err: any) {
      console.error(err);
      setErro('Não foi possível gerar a exportação em PDF do relatório atual.');
    } finally {
      setExportandoPdf(false);
    }
  };

  const limparFluxoAtual = () => {
    setChartData(null);
    setSelectedFile(null);
    setTabelaAtiva(null);
    setColunas([]);
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Motor Analítico de Gotham</h2>
          <p className="text-sm text-gray-400 mt-1">Importe arquivos estruturados ou acesse bases relacionais.</p>
        </div>
        {!chartData && !selectedFile && !tabelaAtiva && (
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 self-start">
            <button onClick={() => { setOrigemDados('file'); setColunas([]); }} className={`px-4 py-2 text-xs font-bold rounded-lg ${origemDados === 'file' ? 'bg-yellow-500 text-gray-950' : 'text-gray-400'}`}>📁 CSV</button>
            <button onClick={() => { setOrigemDados('sql'); setColunas([]); }} className={`px-4 py-2 text-xs font-bold rounded-lg ${origemDados === 'sql' ? 'bg-yellow-500 text-gray-950' : 'text-gray-400'}`}>🔌 SQL</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {erro && <div className="rounded-xl bg-red-950/40 border border-red-800 p-4 text-sm text-red-400">⚠️ {erro}</div>}
          {sucesso && <div className="rounded-xl bg-green-950/40 border border-green-800 p-4 text-sm text-green-400">✅ {sucesso}</div>}

          {origemDados === 'file' && !selectedFile && !uploading && !inspecting && !chartData && (
            <UploadZone onFileSelected={handleFileChange} loading={inspecting} />
          )}

          {origemDados === 'sql' && !tabelaAtiva && !chartData && (
            <SqlForm onTestarConexao={handleTestarConexao} onMapearColunas={handleMapearColunas} loading={loadingDb} />
          )}

          {((origemDados === 'file' && selectedFile) || (origemDados === 'sql' && tabelaAtiva)) && colunas.length > 0 && (
            <CsvMappingForm
              filename={selectedFile ? selectedFile.name : `Tabela: ${tabelaAtiva}`}
              colunas={colunas}
              onCancelar={limparFluxoAtual}
              onProcessar={handleProcessData}
            />
          )}

          {uploading && <div className="flex flex-col items-center justify-center p-12 bg-gray-900/30 border border-dashed rounded-2xl"><span className="text-4xl animate-spin mb-4">⚙️</span><p className="text-sm text-yellow-500">Processando e gerando insights...</p></div>}

          {/* 📊 ÁREA DE RENDERIZAÇÃO DOS INSIGHTS + CARDS DE KPIS */}
          {chartData && (
            <div className="space-y-4 animate-fadeIn">
              <KpiCards kpis={chartData.kpis} />
              <div className="flex items-center justify-between bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl">
                <button
                  onClick={handleExportarPdf}
                  disabled={exportandoPdf}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-950 transition-colors disabled:opacity-50"
                >
                  {exportandoPdf ? (
                    <>
                      <span className="animate-spin">⏳</span> Gerando PDF...
                    </>
                  ) : (
                    <>
                      <span>📄</span> Exportar PDF
                    </>
                  )}
                </button>
                <button onClick={limparFluxoAtual} className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-950 text-gray-400 hover:text-yellow-500">🧹 Nova Análise</button>
              </div>

              {/* 🚀 Gráfico envolvido na div de captura com a referência atribuída */}
              <div ref={areaDoGraficoRef} className="rounded-xl overflow-hidden">
                <DashboardChart data={chartData} />
              </div>
            </div>
          )}
        </div>

        <HistorySidebar
          historico={historico}
          dashboardIdAtivo={chartData?.dashboardId}
          onSelecionarGrafico={(data, t) => { setChartData(data); setSucesso(`Restaurado: ${t}`); }}
          onDeletarItem={handleDeletarItem}
          onDeletarEmLote={handleDeletarEmLote}
        />
      </div>
    </Layout>
  );
}