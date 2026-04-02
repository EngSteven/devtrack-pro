import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Para cerrar sesión, simplemente destruimos la llave y lo mandamos al login
    localStorage.removeItem('devtrack_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
        
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
          <h2 className="text-xl font-bold text-indigo-900 mb-2">¡Acceso Concedido! 🛡️</h2>
          <p className="text-indigo-700">
            Si estás viendo esto, es porque tienes un JWT válido y pasaste el Protected Route.
          </p>
        </div>
      </div>
    </div>
  );
}