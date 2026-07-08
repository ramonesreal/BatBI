import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SqlFormProps {
  onTestConnection: (config: any) => Promise<string[] | void>;
  onMapColumns: (config: any, selectedTable: string) => Promise<void>;
  loading: boolean;
}

export default function SqlForm({ onTestConnection, onMapColumns, loading }: SqlFormProps) {
  const { t } = useTranslation();
  const [dbConfig, setDbConfig] = useState({ host: '', port: '5432', user: '', pass: '', name: '' });
  const [tables, setTables]                   = useState<string[]>([]);
  const [selectedTable, setSelectedTable]     = useState('');
  const [fetchingColumns, setFetchingColumns] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    try {
      const tableList = await onTestConnection(dbConfig);
      if (tableList && Array.isArray(tableList) && tableList.length > 0) {
        setTables(tableList); setSelectedTable(tableList[0]);
      } else { setTables([]); setSelectedTable(''); }
    } catch (err) {
      console.error('[SqlForm] Connection error:', err);
      setTables([]); setSelectedTable('');
    }
  };

  const handleMapTable = async () => {
    if (!selectedTable || fetchingColumns) return;
    setFetchingColumns(true);
    try { await onMapColumns(dbConfig, selectedTable); }
    catch (err) { console.error('[SqlForm] Column mapping error:', err); }
    finally { setFetchingColumns(false); }
  };

  const isConnected = tables.length > 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl animate-fade-in">
      <div className="border-b border-gray-800 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">{t('sql.title')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isConnected ? t('sql.subtitleConnected') : t('sql.subtitleDisconnected')}
          </p>
        </div>
        {isConnected && (
          <button type="button" onClick={() => { setTables([]); setSelectedTable(''); }}
            className="text-xs font-semibold text-red-400 hover:underline bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-900/40 transition-all hover:bg-red-950/40">
            🔌 {t('sql.disconnect')}
          </button>
        )}
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="db-host" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">{t('sql.labelHost')}</label>
              <input id="db-host" type="text" required placeholder={t('sql.placeholderHost')} value={dbConfig.host}
                onChange={e => setDbConfig({ ...dbConfig, host: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors" />
            </div>
            <div>
              <label htmlFor="db-port" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">{t('sql.labelPort')}</label>
              <input id="db-port" type="text" required placeholder={t('sql.placeholderPort')} value={dbConfig.port}
                onChange={e => setDbConfig({ ...dbConfig, port: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="db-user" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">{t('sql.labelUser')}</label>
              <input id="db-user" type="text" required placeholder={t('sql.placeholderUser')} value={dbConfig.user}
                onChange={e => setDbConfig({ ...dbConfig, user: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors" />
            </div>
            <div>
              <label htmlFor="db-pass" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">{t('sql.labelPass')}</label>
              <input id="db-pass" type="password" required placeholder={t('sql.placeholderPass')} value={dbConfig.pass}
                onChange={e => setDbConfig({ ...dbConfig, pass: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label htmlFor="db-name" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">{t('sql.labelDbName')}</label>
            <input id="db-name" type="text" required placeholder={t('sql.placeholderDbName')} value={dbConfig.name}
              onChange={e => setDbConfig({ ...dbConfig, name: e.target.value })}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? `⚙️ ${t('sql.connecting')}` : `🔌 ${t('sql.connect')}`}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="table-select" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              {t('sql.labelTable')}
            </label>
            <select id="table-select" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none font-medium cursor-pointer">
              {tables.map(table => <option key={table} value={table}>📋 {table}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleMapTable} disabled={fetchingColumns}
            className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {fetchingColumns ? `🔍 ${t('sql.mappingColumns')}` : `⚡ ${t('sql.mapColumns')}`}
          </button>
        </div>
      )}
    </div>
  );
}