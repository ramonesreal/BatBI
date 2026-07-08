import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  const handleCadastro = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      // Dispara para a rota de cadastro que você estrutururou no backend
      await api.post('/auth/cadastro', {
        nome,
        email,
        senha,
      });

      // Cadastro feito com sucesso! Redireciona o agente direto para o login
      navigate('/');
    } catch (err: any) {
      console.error('Erro ao cadastrar agente:', err);
      const mensagemErro = err.response?.data?.error || 'Erro ao conectar ao servidor.';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-yellow-500">
            BatBI <span className="text-xl">🦇</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Cadastre um novo agente no sistema de Gotham.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleCadastro} className="space-y-6">

          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Agente
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Bruce Wayne"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-mail de Gotham
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@gotham.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>

          {/* Mensagem de Erro (Se houver) */}
          {erro && (
            <div className="rounded-lg bg-red-950/50 border border-red-800 p-3 text-sm text-red-400 text-center">
              ⚠️ {erro}
            </div>
          )}

          {/* Botão Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-600 py-3 font-semibold text-gray-950 transition-colors hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Registrar Agente'}
          </button>
        </form>

        {/* Link para voltar ao Login */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400">Já tem uma credencial? </span>
          <button
            onClick={() => navigate('/')}
            className="font-medium text-yellow-500 hover:underline bg-transparent border-none cursor-pointer"
          >
            Voltar para o Login
          </button>
        </div>

      </div>
    </div>
  );
}