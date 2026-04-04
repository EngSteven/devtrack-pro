import { useState } from 'react';
import { authService } from '../services/auth.service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Extraemos el token de la URL (?token=xxxxxx)
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid link');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Invalid or missing reset token.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Set new password</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Must be at least 6 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading} className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-800'}`}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}