import { useState } from 'react';

interface HistoricoItem {
  id: string;
  titulo: string;
  createdAt: string;
  chartData: any;
}

interface HistorySidebarProps {
  historico: HistoricoItem[];
  dashboardIdAtivo?: string;
  onSelecionarGrafico: (chartData: any, titulo: string) => void;
  onDeletarItem: (id: string) => Promise<void>;
  onDeletarEmLote: (ids: string[]) => Promise<void>;
}

export default function HistorySidebar({ historico, dashboardIdAtivo, onSelecionarGrafico, onDeletarItem, onDeletarEmLote }: HistorySidebarProps) {
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const modoSelecaoAtivo = itensSelecionados.length > 0;

  const toggleSelecao = (id: string) => {
    setItensSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAlternarTodos = () => {
    if (itensSelecionados.length === historico.length) setItensSelecionados([]);
    else setItensSelecionados(historico.map(item => item.id));
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Análises Recentes</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{itensSelecionados.length} selecionada(s)</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {historico.length > 0 && (
            <button onClick={handleAlternarTodos} className="text-[11px] font-semibold text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
              {itensSelecionados.length === historico.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
            </button>
          )}
          {modoSelecaoAtivo && (
            <button 
              onClick={async () => { await onDeletarEmLote(itensSelecionados); setItensSelecionados([]); }}
              className="text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded-lg animate-fade-in"
            >
              🗑️ Excluir Selecionadas
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        {historico.length === 0 ? (
          <p className="text-xs text-gray-600 italic py-4 text-center">Nenhum histórico registrado.</p>
        ) : (
          historico.map(item => {
            const estaSelecionado = itensSelecionados.includes(item.id);
            return (
              <div key={item.id} className="relative group/box flex items-center gap-2">
                <button
                  onClick={() => toggleSelecao(item.id)}
                  className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all ${estaSelecionado ? 'bg-yellow-500 border-yellow-500 text-gray-950' : 'bg-gray-950 border-gray-800 text-transparent'}`}
                >
                  <span className="text-[10px] font-bold">✓</span>
                </button>

                <button
                  onClick={() => modoSelecaoAtivo ? toggleSelecao(item.id) : onSelecionarGrafico(item.chartData, item.titulo)}
                  className={`w-full text-left p-3 pr-10 rounded-xl border transition-all flex flex-col gap-1.5 ${dashboardIdAtivo === item.id ? 'bg-yellow-500/10 border-yellow-600' : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'}`}
                >
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-yellow-500 truncate block">📊 {item.titulo}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                </button>
                
                <button onClick={(e) => { e.stopPropagation(); onDeletarItem(item.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/box:opacity-100 text-gray-500 hover:text-red-500 p-1">
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}