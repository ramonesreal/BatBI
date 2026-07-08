import React from 'react';

interface KpiData {
  total: number;
  maior: number;
  media: number;
  sufixo?: string;
}

interface KpiCardsProps {
  kpis?: KpiData;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  // Se ainda não houver dados de KPIs processados, exibe um estado vazio ou oculto
  if (!kpis) return null;

  // Função auxiliar para formatar os números de maneira amigável corporativa
  const formatarNumero = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const prefixo = kpis.sufixo || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Faturamento/Soma Total */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Acumulado Total</p>
          <span className="text-yellow-500 bg-yellow-500/10 p-2 rounded-lg text-xs font-bold">∑ Soma</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefixo} {formatarNumero(kpis.total)}
        </p>
      </div>

      {/* Card 2: Média por Categoria */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Média Global</p>
          <span className="text-blue-400 bg-blue-500/10 p-2 rounded-lg text-xs font-bold">÷ Média</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefixo} {formatarNumero(kpis.media)}
        </p>
      </div>

      {/* Card 3: Maior Pico Detectado */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg transition-all hover:border-yellow-500/40">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Pico Máximo</p>
          <span className="text-emerald-400 bg-emerald-500/10 p-2 rounded-lg text-xs font-bold">↑ Maior</span>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">
          {prefixo} {formatarNumero(kpis.maior)}
        </p>
      </div>
    </div>
  );
};