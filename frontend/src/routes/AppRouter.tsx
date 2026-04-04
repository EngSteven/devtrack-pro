import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ProfilePage from '../features/users/pages/ProfilePage';

export default function AppRouter() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* RUTAS PROTEGIDAS (Envueltas por el ProtectedRoute) */}
      <Route element={<ProtectedRoute />}>
        {/* Todo lo que esté aquí adentro requiere el JWT */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        
  
      </Route>

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}