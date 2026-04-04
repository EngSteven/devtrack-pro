import { useState } from 'react';
import { authService } from '../services/auth.service';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
    } catch (err: any) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Forgot Password</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          No worries, we'll send you reset instructions.
        </p>

        {message ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-sm font-medium mb-6">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="you@company.com" />
            </div>
            <button type="submit" disabled={isLoading} className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-800'}`}>
              {isLoading ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to log in
        </Link>
      </div>
    </div>
  );
}