import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { usersService } from '../services/users.service';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await usersService.getProfile();
      setFormData({ name: user.name, email: user.email });
    } catch (error) {
      toast.error('Error loading profile data');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      await usersService.updateProfile({ name: formData.name });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('⚠️ Are you absolutely sure you want to delete your account? This action cannot be undone.');
    if (!confirm1) return;
    
    // Doble confirmación de seguridad
    const confirm2 = window.prompt('Please type "DELETE" to confirm account deletion:');
    if (confirm2 !== 'DELETE') {
      if (confirm2 !== null) toast.error('Deletion cancelled. Text did not match.');
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Deleting account...');
    try {
      await usersService.deleteAccount();
      // Limpiamos el token para cerrar sesión
      localStorage.removeItem('devtrack_token');
      toast.success('Account deleted successfully', { id: loadingToast });
      
      // Lo mandamos de vuelta al login
      navigate('/login');
    } catch (error) {
      toast.error('Error deleting account', { id: loadingToast });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Header Minimalista */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Account Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Menú Lateral (Preparado para el futuro) */}
          <aside className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl transition-colors">
              <UserIcon className="w-5 h-5" /> General Profile
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-200 font-medium rounded-xl transition-colors opacity-50 cursor-not-allowed" title="Coming soon">
              <Shield className="w-5 h-5" /> Security
            </button>
          </aside>

          {/* Contenido del Perfil */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Personal Information</h2>
                <p className="text-sm text-slate-500 mt-1">Update your photo and personal details here.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Avatar (Visual) */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <button type="button" className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-6"></div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm transition-all outline-none text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        readOnly
                        disabled
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-500 sm:text-sm cursor-not-allowed"
                        title="Email cannot be changed directly"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-red-800 font-bold mb-2">Danger Zone</h3>
              <p className="text-red-600/80 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                disabled={isSaving}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}