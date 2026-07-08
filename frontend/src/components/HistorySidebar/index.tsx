import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HistoryItem { id: string; title: string; createdAt: string; chartData: any; }

interface HistorySidebarProps {
  history: HistoryItem[];
  activeDashboardId?: string;
  onSelectChart: (chartData: any, title: string) => void;
  onDeleteItem: (id: string) => Promise<void>;
  onBatchDelete: (ids: string[]) => Promise<void>;
}

export default function HistorySidebar({ history, activeDashboardId, onSelectChart, onDeleteItem, onBatchDelete }: HistorySidebarProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionModeActive = selectedIds.length > 0;

  const toggleSelection = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleToggleAll = () => {
    if (selectedIds.length === history.length) setSelectedIds([]);
    else setSelectedIds(history.map(item => item.id));
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{t('history.title')}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{t('history.selected', { count: selectedIds.length })}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {history.length > 0 && (
            <button onClick={handleToggleAll}
              className="text-[11px] font-semibold text-yellow-500 bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
              {selectedIds.length === history.length ? t('history.deselectAll') : t('history.selectAll')}
            </button>
          )}
          {selectionModeActive && (
            <button onClick={async () => { await onBatchDelete(selectedIds); setSelectedIds([]); }}
              className="text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/60 px-2.5 py-1 rounded-lg animate-fade-in">
              🗑️ {t('history.deleteSelected')}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        {history.length === 0 ? (
          <p className="text-xs text-gray-600 italic py-4 text-center">{t('history.empty')}</p>
        ) : (
          history.map(item => {
            const isSelected = selectedIds.includes(item.id);
            const action = isSelected ? t('history.deselect') : t('history.select');
            return (
              <div key={item.id} className="relative group/box flex items-center gap-2">
                <button aria-label={t('history.checkboxLabel', { action, title: item.title })}
                  onClick={() => toggleSelection(item.id)}
                  className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all ${isSelected ? 'bg-yellow-500 border-yellow-500 text-gray-950' : 'bg-gray-950 border-gray-800 text-transparent'}`}>
                  <span className="text-[10px] font-bold">✓</span>
                </button>
                <button
                  onClick={() => selectionModeActive ? toggleSelection(item.id) : onSelectChart(item.chartData, item.title)}
                  className={`w-full text-left p-3 pr-10 rounded-xl border transition-all flex flex-col gap-1.5 ${activeDashboardId === item.id ? 'bg-yellow-500/10 border-yellow-600' : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'}`}>
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-yellow-500 truncate block">📊 {item.title}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{new Date(item.createdAt).toLocaleString('en-US')}</span>
                </button>
                <button
                  aria-label={t('history.checkboxLabel', { action: t('history.deselect'), title: item.title })}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await onDeleteItem(item.id);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/box:opacity-100 text-gray-500 hover:text-red-500 p-1 transition-opacity z-10"
                >
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