import React from 'react';
import { useTranslation } from 'react-i18next';

interface KpiData { 
  total?: number; 
  maior?: number;
  max?: number;
  media?: number; 
  average?: number; 
  sufixo?: string; 
}

interface KpiCardsProps { kpis?: KpiData; }

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  const { t } = useTranslation();
  if (!kpis) return null;

  // 🛡️ Função blindada contra valores undefined ou null
  const formatNumber = (value: any) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return '0';
    }
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const prefix = kpis.sufixo || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Total */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t('kpi.total')}</p>
          <span className="text-yellow-500 bg-yellow-500/10 p-2 rounded-lg text-xs font-bold">{t('kpi.totalBadge')}</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefix} {formatNumber(kpis.total ?? (kpis as any).totalRows)}
        </p>
      </div>

      {/* 2. Global Average */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t('kpi.average')}</p>
          <span className="text-blue-400 bg-blue-500/10 p-2 rounded-lg text-xs font-bold">{t('kpi.averageBadge')}</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefix} {formatNumber(kpis.media ?? (kpis as any).average)}
        </p>
      </div>

      {/* 3. Peak Maximum */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t('kpi.peak')}</p>
          <span className="text-emerald-400 bg-emerald-500/10 p-2 rounded-lg text-xs font-bold">{t('kpi.peakBadge')}</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefix} {formatNumber(kpis.max ?? kpis.maior)}
        </p>
      </div>
    </div>
  );
};