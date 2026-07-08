import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toPng } from 'html-to-image';
import Layout from '../../components/Layout';
import UploadZone from '../../components/UploadZone';
import DashboardChart from '../../components/DashboardChart';
import SqlForm from '../../components/SqlForm';
import CsvMappingForm from '../../components/CsvMappingForm';
import HistorySidebar from '../../components/HistorySidebar';
import { KpiCards } from '../../components/KpiCards';
import { api } from '../../services/api';
import { exportService } from '../../services/exportService';

interface HistoryItem {
  id: string;
  title: string;
  createdAt: string;
  chartData: any;
}

interface AnalysisConfig {
  xAxis: string;
  yAxis: string;
  chartType: string;
}

export default function Dashboard() {
  const { t } = useTranslation();

  const [uploading, setUploading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chartData, setChartData] = useState<any>(null);
  const [dataSource, setDataSource] = useState<'file' | 'sql'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [activeDbConfig, setActiveDbConfig] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      const response = await api.get('/analytics/history');
      const normalized = response.data.map((item: any) => {
        const verifiedId = item.id ?? item._id ?? item.dashboardId;

        return {
          ...item,
          id: verifiedId ? String(verifiedId) : '',
          title: item.title ?? item.titulo ?? 'Untitled Analysis',
          chartData: typeof item.chartData === 'string'
            ? JSON.parse(item.chartData)
            : item.chartData,
        };
      });

      setHistory(normalized.filter((item: any) => item.id !== ''));
    } catch (err) {
      console.error('[Dashboard] Failed to load analysis history:', err);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleTestConnection = async (dbConfig: any) => {
    setLoadingDb(true); setError(''); setSuccess('');
    try {
      const response = await api.post('/analytics/db-test', dbConfig);
      setSuccess(response.data.message || t('sql.subtitleConnected'));
      return (response.data.tables ?? response.data.tabelas) || [];
    } catch (err: any) {
      setError(err.response?.data?.error || t('sql.subtitleDisconnected'));
    } finally { setLoadingDb(false); }
  };

  const handleMapColumns = async (dbConfig: any, selectedTable: string) => {
    setError(''); setSuccess('');
    try {
      const response = await api.post('/analytics/db-columns', { ...dbConfig, tableName: selectedTable });
      setColumns((response.data.columns ?? response.data.colunas) || []);
      setActiveTable(selectedTable);
      setActiveDbConfig(dbConfig);
    } catch (err: any) {
      setError(err.response?.data?.error || t('sql.mappingColumns'));
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm(t('dashboard.confirmDelete'))) return;
    try {
      await api.delete(`/analytics/history/${id}`);
      if (chartData?.dashboardId === id) setChartData(null);
      setSuccess(t('dashboard.deleteSuccess')); loadHistory();
    } catch { setError(t('dashboard.errorDelete')); }
  };

  const handleBatchDelete = async (ids: string[]) => {
    if (!confirm(t('dashboard.confirmBatchDelete', { count: ids.length }))) return;
    try {
      await api.delete('/analytics/history', { data: { ids } });
      if (chartData && ids.includes(chartData.dashboardId)) setChartData(null);
      setSuccess(t('dashboard.deleteSuccess')); loadHistory();
    } catch { setError(t('dashboard.errorBatchDelete')); }
  };

  const handleFileChange = async (file: File) => {
    setInspecting(true); setError(''); setSuccess(''); setChartData(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/analytics/inspect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setColumns((response.data.columns ?? response.data.colunas) || []);
      setSelectedFile(file);
    } catch (err: any) {
      setError(err.response?.data?.error || t('upload.errorFormat'));
      setSelectedFile(null);
    } finally { setInspecting(false); }
  };

  const handleProcessData = async (config: AnalysisConfig) => {
    setUploading(true); setError(''); setSuccess('');
    try {
      if (dataSource === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('xAxis', config.xAxis);
        formData.append('yAxis', config.yAxis);
        formData.append('chartType', config.chartType);
        const response = await api.post('/analytics/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setChartData(response.data); setSelectedFile(null);
      } else if (dataSource === 'sql' && activeDbConfig && activeTable) {
        const payload = { ...activeDbConfig, tableName: activeTable, xAxis: config.xAxis, yAxis: config.yAxis, chartType: config.chartType };
        const response = await api.post('/analytics/query', payload);
        setChartData(response.data); setActiveTable(null);
      }
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || t('dashboard.processing'));
    } finally { setUploading(false); }
  };

  const handleExportPdf = async () => {
    if (!chartData || !chartAreaRef.current) return;
    setExportingPdf(true); setError(''); setSuccess('');
    try {
      const chartImageBase64 = await toPng(chartAreaRef.current, {
        backgroundColor: '#020617', style: { padding: '12px' },
      });
      await exportService.downloadReportPdf({
        title: chartData.datasets?.[0]?.label || 'BatBI_Analysis',
        kpis: chartData.kpis,
        labels: chartData.labels,
        datasets: chartData.datasets,
        chartImage: chartImageBase64,
      }, chartData.dashboardId);
      setSuccess(t('dashboard.exportPdf'));
    } catch (err: any) {
      console.error('[Dashboard] PDF export error:', err);
      setError(t('dashboard.generatingPdf'));
    } finally { setExportingPdf(false); }
  };

  const clearCurrentFlow = () => {
    setChartData(null); setSelectedFile(null);
    setActiveTable(null); setColumns([]);
    setError(''); setSuccess('');
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.title')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        {!chartData && !selectedFile && !activeTable && (
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 self-start">
            <button
              id="source-toggle-csv"
              onClick={() => { setDataSource('file'); setColumns([]); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${dataSource === 'file' ? 'bg-yellow-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'}`}
            >
              📁 {t('dashboard.sourceFile')}
            </button>
            <button
              id="source-toggle-sql"
              onClick={() => { setDataSource('sql'); setColumns([]); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${dataSource === 'sql' ? 'bg-yellow-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'}`}
            >
              🔌 {t('dashboard.sourceSql')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div id="dashboard-error-banner" role="alert" aria-live="assertive"
              className="rounded-xl bg-red-950/40 border border-red-800 p-4 text-sm text-red-400 flex items-start gap-2">
              <span aria-hidden="true">⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div id="dashboard-success-banner" role="status" aria-live="polite"
              className="rounded-xl bg-green-950/40 border border-green-800 p-4 text-sm text-green-400 flex items-start gap-2">
              <span aria-hidden="true">✅</span><span>{success}</span>
            </div>
          )}

          {dataSource === 'file' && !selectedFile && !uploading && !inspecting && !chartData && (
            <UploadZone onFileSelected={handleFileChange} loading={inspecting} />
          )}
          {dataSource === 'sql' && !activeTable && !chartData && (
            <SqlForm onTestConnection={handleTestConnection} onMapColumns={handleMapColumns} loading={loadingDb} />
          )}
          {((dataSource === 'file' && selectedFile) || (dataSource === 'sql' && activeTable)) && columns.length > 0 && (
            <CsvMappingForm
              filename={selectedFile ? selectedFile.name : `Table: ${activeTable}`}
              columns={columns}
              onCancel={clearCurrentFlow}
              onProcess={handleProcessData}
              loading={uploading}
            />
          )}

          {uploading && (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-900/30 border border-dashed border-gray-700 rounded-2xl">
              <span className="text-4xl animate-spin mb-4" aria-hidden="true">⚙️</span>
              <p className="text-sm text-yellow-500 font-medium">{t('dashboard.processing')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('dashboard.processingDetail')}</p>
            </div>
          )}

          {chartData && (
            <div className="space-y-4 animate-fadeIn">
              <KpiCards kpis={chartData.kpis} />
              <div className="flex items-center justify-between bg-gray-900 border border-gray-800 px-4 py-2.5 rounded-xl">
                <button id="export-pdf-btn" onClick={handleExportPdf} disabled={exportingPdf}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {exportingPdf
                    ? <><span className="animate-spin" aria-hidden="true">⏳</span> {t('dashboard.generatingPdf')}</>
                    : <><span aria-hidden="true">📄</span> {t('dashboard.exportPdf')}</>}
                </button>
                <button id="new-analysis-btn" onClick={clearCurrentFlow}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-950 text-gray-400 hover:text-yellow-500 transition-colors">
                  🧹 {t('dashboard.newAnalysis')}
                </button>
              </div>
              <div ref={chartAreaRef} className="rounded-xl overflow-hidden">
                <DashboardChart data={chartData} />
              </div>
            </div>
          )}
        </div>

        <HistorySidebar
          history={history}
          activeDashboardId={chartData?.dashboardId}
          onSelectChart={(data, title) => { setChartData(data); setSuccess(t('dashboard.analysisRestored', { title })); }}
          onDeleteItem={handleDeleteItem}
          onBatchDelete={handleBatchDelete}
        />
      </div>
    </Layout>
  );
}