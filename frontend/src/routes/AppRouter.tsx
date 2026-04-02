import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas Públicas de la Feature de Auth */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}