import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashBoardPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* RUTAS PROTEGIDAS (Envueltas por el ProtectedRoute) */}
      <Route element={<ProtectedRoute />}>
        {/* Todo lo que esté aquí adentro requiere el JWT */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
  
      </Route>

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}