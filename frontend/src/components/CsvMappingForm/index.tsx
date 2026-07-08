import { useState } from 'react';

interface CsvMappingFormProps {
  filename: string;
  colunas: string[];
  onCancelar: () => void;
  onProcessar: (config: { eixoX: string; eixoY: string; tipoGrafico: string }) => void;
  loading?: boolean; // 🔥 Adicionado para controlar o estado do botão globalmente
}

export default function CsvMappingForm({ filename, colunas, onCancelar, onProcessar, loading = false }: CsvMappingFormProps) {
  const [eixoX, setEixoX] = useState(colunas[0] || '');
  const [eixoY, setEixoY] = useState(colunas[1] || colunas[0] || '');
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const handleProcessar = () => {
    if (loading) return;

    // 🛑 Validação Visual Crítica: Evita requisições quebradas antes de irem pro backend
    if (eixoX === eixoY) {
      setErroLocal('O Eixo X e o Eixo Y não podem ser a mesma coluna. Escolha dimensões diferentes.');
      return;
    }

    setErroLocal(null);
    onProcessar({ eixoX, eixoY, tipoGrafico });
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Configuração de Mapeamento No-Code</h3>
          <p className="text-xs text-gray-500 mt-0.5">Dataset ativo: <span className="text-yellow-500 font-mono">{filename}</span></p>
        </div>
        <button
          onClick={onCancelar}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>

      {/* ⚠️ Alerta amigável de erro local */}
      {erroLocal && (
        <div className="mb-4 rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-400 animate-fade-in">
          ⚠️ {erroLocal}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Eixo X (Dimensão)</label>
          <select
            value={eixoX}
            onChange={e => { setEixoX(e.target.value); setErroLocal(null); }}
            disabled={loading}
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none disabled:opacity-50"
          >
            {colunas.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Eixo Y (Métrica Numérica)</label>
          <select
            value={eixoY}
            onChange={e => { setEixoY(e.target.value); setErroLocal(null); }}
            disabled={loading}
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none disabled:opacity-50"
          >
            {colunas.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Tipo de Gráfico</label>
          <select
            value={tipoGrafico}
            onChange={e => setTipoGrafico(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-yellow-600/40 bg-gray-950 px-4 py-3 text-sm text-yellow-500 focus:border-yellow-600 focus:outline-none font-medium disabled:opacity-50"
          >
            <option value="bar">📊 Gráfico de Barras</option>
            <option value="line">📈 Gráfico de Linhas</option>
            <option value="pie">🍕 Gráfico de Pizza</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleProcessar}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⚙️ Processando Engine Gotham...' : '🚀 Disparar Motor Analítico'}
      </button>
    </div>
  );
}