import { useState } from 'react';

interface SqlFormProps {
  onTestarConexao: (config: any) => Promise<string[] | void>;
  onMapearColunas: (config: any, tabelaSelecionada: string) => Promise<void>;
  loading: boolean;
}

export default function SqlForm({ onTestarConexao, onMapearColunas, loading }: SqlFormProps) {
  const [dbConfig, setDbConfig] = useState({
    host: '',
    port: '5432',
    user: '',
    pass: '',
    name: ''
  });

  const [tabelas, setTabelas] = useState<string[]>([]);
  const [tabelaSelecionada, setTabelaSelecionada] = useState('');
  const [buscandoColunas, setBuscandoColunas] = useState(false);

  const handleConectar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      const listaTabelas = await onTestarConexao(dbConfig);
      if (listaTabelas && Array.isArray(listaTabelas) && listaTabelas.length > 0) {
        setTabelas(listaTabelas);
        setTabelaSelecionada(listaTabelas[0]);
      } else {
        // Se a conexão não retornar tabelas ou falhar silenciosamente no pai
        setTabelas([]);
        setTabelaSelecionada('');
      }
    } catch (err) {
      console.error("Erro capturado no formulário de conexão:", err);
      setTabelas([]);
      setTabelaSelecionada('');
    }
  };

  const handleMapearTabela = async () => {
    if (!tabelaSelecionada || buscandoColunas) return;
    setBuscandoColunas(true);
    try {
      await onMapearColunas(dbConfig, tabelaSelecionada);
    } catch (err) {
      console.error("Erro capturado ao mapear colunas da tabela:", err);
    } finally {
      setBuscandoColunas(false);
    }
  };

  const conectadoComSucesso = tabelas.length > 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl animate-fade-in">
      <div className="border-b border-gray-800 pb-4 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Credenciais do Banco de Dados PostgreSQL</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {conectadoComSucesso ? 'Banco de dados conectado.' : 'Assegure-se de que o firewall permite conexões externas.'}
          </p>
        </div>
        {conectadoComSucesso && (
          <button
            type="button"
            onClick={() => { setTabelas([]); setTabelaSelecionada(''); }}
            className="text-xs font-semibold text-red-400 hover:underline bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-900/40 transition-all hover:bg-red-950/40"
          >
            🔌 Desconectar
          </button>
        )}
      </div>

      {!conectadoComSucesso ? (
        <form onSubmit={handleConectar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Host / IP</label>
              <input
                type="text"
                required
                placeholder="Ex: db.gotham.com"
                value={dbConfig.host}
                onChange={e => setDbConfig({ ...dbConfig, host: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Porta</label>
              <input
                type="text"
                required
                placeholder="5432"
                value={dbConfig.port}
                onChange={e => setDbConfig({ ...dbConfig, port: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Usuário</label>
              <input
                type="text"
                required
                placeholder="postgres"
                value={dbConfig.user}
                onChange={e => setDbConfig({ ...dbConfig, user: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Senha</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={dbConfig.pass}
                onChange={e => setDbConfig({ ...dbConfig, pass: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Nome do Banco de Dados</label>
            <input
              type="text"
              required
              placeholder="gotham_metrics"
              value={dbConfig.name}
              onChange={e => setDbConfig({ ...dbConfig, name: e.target.value })}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white focus:border-yellow-600 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⚙️ Estabelecendo Handshake...' : '🔌 Testar e Conectar Banco'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Selecione a Tabela para Análise
            </label>
            <select
              value={tabelaSelecionada}
              onChange={e => setTabelaSelecionada(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white focus:border-yellow-600 focus:outline-none font-medium cursor-pointer"
            >
              {tabelas.map(tab => (
                <option key={tab} value={tab}>📋 {tab}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleMapearTabela}
            disabled={buscandoColunas}
            className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscandoColunas ? '🔍 Inspecionando Esquema...' : '⚡ Mapear Colunas da Tabela'}
          </button>
        </div>
      )}
    </div>
  );
}