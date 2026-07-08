import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // API call to backend auth endpoint
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Store token securely in localStorage for authentication persistence
      localStorage.setItem('@BatBI:token', token);
      localStorage.setItem('@BatBI:user', JSON.stringify(user));

      navigate('/dashboard');

    } catch (err: any) {
      console.error('Error during signin:', err);
      const errorMessage = err.response?.data?.error || 'Error connecting to the server.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-yellow-500">
            BatBI <span>🦇</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your credentials to access the analytical engine.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Gotham Email
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

            {/* Password Field */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-300">
                Access Password
              </label>
              <input
                id="senha"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Inline Error Message */}
          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-800 p-3 text-sm text-red-400 text-center animate-pulse">
              ⚠️ Access Denied: {error}
            </div>
          )}

          {/* Action Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-yellow-500 px-4 py-3 text-sm font-bold text-gray-950 transition-colors hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
            >
              {loading ? 'Entering...' : 'Enter the Cave'}
            </button>
          </div>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400">New around here? </span>
          <button
            onClick={() => navigate('/cadastro')}
            className="font-medium text-yellow-500 hover:underline bg-transparent border-none cursor-pointer"
            >
            Create agent account
          </button>
        </div>

      </div>
    </div>
  );
}