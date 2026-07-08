import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    
    try {
      // Faz o disparo para a rota de login do backend Node
      const response = await api.post('/auth/login', {
        email,
        senha,
      });

      // Se deu certo, o backend retorna o token JWT
      const { token, user } = response.data;
      
      console.log('Login bem-sucedido! Token:', token);
      
      // Salva temporariamente no localStorage para não perder o acesso ao atualizar
      localStorage.setItem('@BatBI:token', token);
      localStorage.setItem('@BatBI:user', JSON.stringify(user));

      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      // Pega a mensagem de erro vinda do backend, se houver
      const mensagemErro = error.response?.data?.error || 'Erro ao conectar ao servidor.';
      alert(`Acesso Negado: ${mensagemErro}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        
        {/* Header da Caverna */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-yellow-500">
            BatBI <span>🦇</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Insira suas credenciais para acessar o motor analítico.
          </p>
        </div>

        {/* Formulário */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Campo de E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                E-mail de Gotham
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none"
                placeholder="bruce@wayne.com"
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-300">
                Senha de Acesso
              </label>
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Botão de Ação */}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-yellow-500 px-4 py-3 text-sm font-bold text-gray-950 transition-colors hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Entrar na Caverna
            </button>
          </div>
        </form>

        {/* Link para Cadastro */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400">Novo por aqui? </span>
          <button
            onClick={() => navigate('/cadastro')}
            className="font-medium text-yellow-500 hover:underline bg-transparent border-none cursor-pointer"
            >
            Criar conta de agente
          </button>
        </div>

      </div>
    </div>
  );
}