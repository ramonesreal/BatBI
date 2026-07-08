import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CsvMappingFormProps {
  filename: string;
  columns: string[];
  onCancel: () => void;
  onProcess: (config: { xAxis: string; yAxis: string; chartType: string }) => void;
  loading?: boolean;
}

export default function CsvMappingForm({ filename, columns, onCancel, onProcess, loading = false }: CsvMappingFormProps) {
  const { t } = useTranslation();
  const [xAxis, setXAxis]           = useState(columns[0] || '');
  const [yAxis, setYAxis]           = useState(columns[1] || columns[0] || '');
  const [chartType, setChartType]   = useState('bar');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleProcess = () => {
    if (loading) return;
    if (xAxis === yAxis) { setLocalError(t('mapping.errorSameAxis')); return; }
    setLocalError(null);
    onProcess({ xAxis, yAxis, chartType });
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">{t('mapping.title')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('mapping.dataset')}: <span className="text-yellow-500 font-mono">{filename}</span>
          </p>
        </div>
        <button onClick={onCancel} disabled={loading}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          {t('mapping.cancel')}
        </button>
      </div>

      {localError && (
        <div role="alert" className="mb-4 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400 animate-fade-in">
          ⚠️ {localError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="axis-x-select" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
            {t('mapping.xAxis')}
          </label>
          <select id="axis-x-select" value={xAxis} onChange={e => { setXAxis(e.target.value); setLocalError(null); }}
            disabled={loading} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none disabled:opacity-50">
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="axis-y-select" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
            {t('mapping.yAxis')}
          </label>
          <select id="axis-y-select" value={yAxis} onChange={e => { setYAxis(e.target.value); setLocalError(null); }}
            disabled={loading} className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none disabled:opacity-50">
            {columns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="chart-type-select" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
            {t('mapping.chartType')}
          </label>
          <select id="chart-type-select" value={chartType} onChange={e => setChartType(e.target.value)}
            disabled={loading} className="w-full rounded-xl border border-yellow-600/40 bg-gray-950 px-4 py-3 text-sm text-yellow-500 focus:border-yellow-600 focus:outline-none font-medium disabled:opacity-50">
            <option value="bar">📊 {t('mapping.chartBar')}</option>
            <option value="line">📈 {t('mapping.chartLine')}</option>
            <option value="pie">🍕 {t('mapping.chartPie')}</option>
          </select>
        </div>
      </div>

      <button id="run-analysis-btn" onClick={handleProcess} disabled={loading}
        className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? `⚙️ ${t('mapping.running')}` : `🚀 ${t('mapping.run')}`}
      </button>
    </div>
  );
}