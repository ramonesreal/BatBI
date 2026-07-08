import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

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
            <button className="w-full flex items-center gap-3 bg-gray-950 border border-yellow-600/30 text-yellow-500 px-4 py-3 rounded-xl text-sm font-medium transition-all">
              📊 <span>Análise de Dados</span>
            </button>
            
            {/* Futuras abas podem entrar aqui (ex: Histórico, Configurações) */}
            <button disabled className="w-full flex items-center gap-3 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium cursor-not-allowed text-left">
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

    </div>
  );
}