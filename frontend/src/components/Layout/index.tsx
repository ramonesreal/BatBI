import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Estado para controlar a abertura do modal de configurações
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Função para deslogar o agente limpando o LocalStorage
  const handleLogout = () => {
    localStorage.removeItem('@BatBI:token');
    navigate('/'); // Chuta de volta para o login
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      
      {/* 🧭 SIDEBAR FIXA NA ESQUERDA */}
      <aside className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col justify-between p-6">
        <div>
          {/* Brand/Logo */}
          <div className="mb-10 flex items-center gap-2">
            <span className="text-2xl">🦇</span>
            <h1 className="text-xl font-extrabold tracking-tight text-yellow-500">
              BatBI <span className="text-xs text-gray-500 font-mono">v1.0</span>
            </h1>
          </div>

          {/* Menu de Navegação */}
          <nav className="space-y-2">
            <button 
              onClick={() => navigate('/dashboard')} // Adapte para sua rota do dashboard se necessário
              className="w-full flex items-center gap-3 bg-gray-950 border border-yellow-600/30 text-yellow-500 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            >
              📊 <span>Análise de Dados</span>
            </button>
            
            {/* ⚙️ Botão de Configurações - Ativado e sem disabled */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 text-gray-400 hover:text-yellow-500 hover:bg-gray-950/50 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
            >
              ⚙️ <span>Configurações</span>
            </button>
          </nav>
        </div>

        {/* Botão de Logout no Rodapé da Sidebar */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
        >
          🚪 <span>Sair do Sistema</span>
        </button>
      </aside>

      {/* 🖥️ ÁREA DE CONTEÚDO PRINCIPAL (DIREITA) */}
      <main className="flex-1 flex flex-col">
        {/* Header Superior Interno */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-8 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Terminal Conectado</span>
          </div>
          <div className="text-sm text-gray-400">
            Agente: <span className="text-yellow-500 font-medium">Operacional</span>
          </div>
        </header>

        {/* Conteúdo Dinâmico da Página */}
        <section className="flex-1 p-8 overflow-y-auto">
          {children}
        </section>
      </main>

      {/* 🪟 MODAL DE CONFIGURAÇÕES */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ⚙️ Configurações / Settings
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo - Seleção de Idioma */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Idioma do Sistema / System Language
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => i18n.changeLanguage('pt')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold transition-all ${
                    i18n.language.startsWith('pt')
                      ? 'bg-yellow-500 text-gray-950 border-yellow-500'
                      : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">🇧🇷 Português</span>
                  {i18n.language.startsWith('pt') && <span>✓</span>}
                </button>

                <button
                  onClick={() => i18n.changeLanguage('en')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-bold transition-all ${
                    i18n.language.startsWith('en')
                      ? 'bg-yellow-500 text-gray-950 border-yellow-500'
                      : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">🇺🇸 English</span>
                  {i18n.language.startsWith('en') && <span>✓</span>}
                </button>
              </div>
            </div>

            {/* Botão de Fechar */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-gray-950 text-gray-400 hover:text-white rounded-xl text-xs font-bold border border-gray-800 transition-colors"
              >
                Concluído / Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}