import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  // Verificamos si existe nuestra "llave"
  const token = localStorage.getItem('devtrack_token');

  // Si no hay llave, lo redireccionamos a la pantalla de login inmediatamente
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay llave, lo dejamos pasar a la ruta que estaba intentando visitar (<Outlet />)
  return <Outlet />;
}