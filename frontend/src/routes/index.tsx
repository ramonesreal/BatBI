import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Login from '../pages/Login';
import Cadastro from '../pages/Cadastro';
import Dashboard from '../pages/Dashboard';

// Simple helper to check if the agent is authenticated (client-side indication)
const isAuthenticated = () => {
  return !!localStorage.getItem('@BatBI:user');
};

// Route guard component to protect the Dashboard from unauthorized access
function PrivateRoute({ children }: { children: ReactElement }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Private Route (Protected) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Fallback route: redirects any unrecognized paths to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}