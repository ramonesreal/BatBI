import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Dashboard from '../pages/Dashboard';

// Função simples para checar se o agente está autenticado
const isAuthenticated = () => {
  return !!localStorage.getItem('@BatBI:token');
};

// Componente para proteger o Dashboard de acessos não autorizados
function PrivateRoute({ children }: { children: ReactElement }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rota Privada (Protegida) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Rota de fuga: se digitar qualquer coisa errada, volta para o Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}