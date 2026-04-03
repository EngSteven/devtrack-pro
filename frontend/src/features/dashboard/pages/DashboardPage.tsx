import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Plus, Building2, MoreVertical, LayoutTemplate, 
  Users, CheckSquare, Clock, LogOut, Settings,
  Edit2, Trash2, X 
} from 'lucide-react';
import { organizationsService } from '../../organizations/services/organizations.service';
import { projectsService } from '../../projects/services/projects.service';
import type { Organization, Project } from '../../../shared/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '' });

  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);

  useEffect(() => { loadOrganizations(); }, []);
  useEffect(() => { if (activeOrg) loadProjects(activeOrg.id); }, [activeOrg]);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationsService.getMyOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0 && (!activeOrg || !orgs.find(o => o.id === activeOrg.id))) {
        setActiveOrg(orgs[0]);
      } else if (orgs.length === 0) {
        setActiveOrg(null);
      }
    } catch (error) {
      toast.error('Error loading organizations');
    }
  };

  const loadProjects = async (orgId: string) => {
    try {
      const projs = await projectsService.getProjectsByOrg(orgId);
      setProjects(projs);
    } catch (error) {
      toast.error('Error loading projects');
    }
  };

  // --- ORGANIZATION ACTIONS ---
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const loadingToast = toast.loading('Creating organization...');
    try {
      const newOrg = await organizationsService.createOrganization(newOrgName);
      setNewOrgName('');
      setIsCreatingOrg(false);
      const orgs = await organizationsService.getMyOrganizations();
      setOrganizations(orgs);
      setActiveOrg(orgs.find(o => o.id === newOrg.id) || orgs[0]);
      toast.success(`Organization ${newOrg.name} created!`, { id: loadingToast });
    } catch (error) {
      toast.error('Error creating organization', { id: loadingToast });
    }
  };

  const handleRenameOrg = async () => {
    setIsOrgMenuOpen(false);
    if (!activeOrg) return;
    const newName = window.prompt('New organization name:', activeOrg.name);
    if (newName && newName.trim() !== '' && newName !== activeOrg.name) {
      const loadingToast = toast.loading('Renaming...');
      try {
        await organizationsService.updateOrganization(activeOrg.id, newName);
        loadOrganizations();
        toast.success('Organization renamed successfully', { id: loadingToast });
      } catch (error) {
        toast.error('Error renaming organization', { id: loadingToast });
      }
    }
  };

  const handleDeleteOrg = async () => {
    setIsOrgMenuOpen(false);
    if (!activeOrg) return;
    const confirm = window.confirm(`⚠️ ARE YOU SURE? This will permanently delete "${activeOrg.name}" and ALL its projects.`);
    if (confirm) {
      const loadingToast = toast.loading('Deleting organization...');
      try {
        await organizationsService.deleteOrganization(activeOrg.id);
        loadOrganizations();
        toast.success('Organization deleted', { id: loadingToast });
      } catch (error) {
        toast.error('Error deleting organization', { id: loadingToast });
      }
    }
  };

  // --- PROJECT ACTIONS ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newProjectData.name.trim()) return;
    const loadingToast = toast.loading('Creating project...');
    try {
      await projectsService.createProject(activeOrg.id, newProjectData.name, newProjectData.description);
      setNewProjectData({ name: '', description: '' });
      setIsCreatingProject(false);
      loadProjects(activeOrg.id);
      toast.success('Project created successfully', { id: loadingToast });
    } catch (error) {
      toast.error('Error creating project', { id: loadingToast });
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!activeOrg) return;
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"?`)) {
      try {
        await projectsService.deleteProject(activeOrg.id, projectId);
        loadProjects(activeOrg.id);
        toast.success('Project deleted');
      } catch (error) {
        toast.error('Error deleting project');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devtrack_token');
    navigate('/login');
  };

  const isOwner = activeOrg?.myRole === 'OWNER';
  const isAdminOrOwner = isOwner || activeOrg?.myRole === 'ADMIN';

  return (
    <div className="h-screen w-full bg-slate-50 flex text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl z-10 border-r border-slate-800">
        <div className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">DevTrack<span className="text-indigo-400">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-2">
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Your Account</p>
              <p className="text-xs text-slate-400 truncate">Settings</p>
            </div>
            <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex justify-between items-center mb-3 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</p>
            <button onClick={() => setIsCreatingOrg(!isCreatingOrg)} className="text-slate-400 hover:text-white transition-colors hover:cursor-pointer" title="New Organization">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isCreatingOrg && (
            <form onSubmit={handleCreateOrg} className="mb-4 p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
              <input autoFocus type="text" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Company name..." className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-600 text-white focus:ring-1 focus:ring-indigo-500 outline-none mb-2" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">Create</button>
                <button type="button" onClick={() => setIsCreatingOrg(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-1.5 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-1">
            {organizations.map(org => (
              <button key={org.id} onClick={() => setActiveOrg(org)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group ${activeOrg?.id === org.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'hover:bg-slate-800 text-slate-300'}`}>
                <Building2 className={`w-4 h-4 shrink-0 ${activeOrg?.id === org.id ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span className="truncate font-medium">{org.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0 mt-auto bg-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto">
        {activeOrg ? (
          <div className="max-w-6xl mx-auto p-8 md:p-12">
            
            <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4 relative">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeOrg.name}</h2>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {activeOrg.myRole}
                  </span>
                </div>
                <p className="text-slate-500">Manage your projects and team activity</p>
              </div>
              
              {isAdminOrOwner && (
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> New Project
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)} 
                      onBlur={() => setTimeout(() => setIsOrgMenuOpen(false), 200)}
                      title="More Options"
                      className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border border-transparent hover:border-slate-300"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {isOrgMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={handleRenameOrg}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Rename Organization
                        </button>
                        {isOwner && (
                          <button 
                            onClick={handleDeleteOrg}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Organization
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </header>

            {isCreatingProject && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50 mb-10 transform transition-all animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">New Project Details</h3>
                  <button
                    onClick={() => setIsCreatingProject(false)}
                    onBlur={() => setTimeout(() => setIsOrgMenuOpen(false), 200)}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border border-transparent hover:border-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4">
                  <input autoFocus type="text" value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} placeholder="E.g., Cloud Migration..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  <input type="text" value={newProjectData.description} onChange={e => setNewProjectData({...newProjectData, description: e.target.value})} placeholder="Short description (optional)..." className="flex-2 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">Create</button>
                </form>
              </div>
            )}

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <div key={project.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col cursor-pointer relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 ${project.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                      {isAdminOrOwner && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, project.name); }} className="text-slate-400 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2 leading-relaxed">
                      {project.description || 'No detailed description provided.'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-auto pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5" title="Team members">
                        <Users className="w-3.5 h-3.5" /> <span>0</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Pending tasks">
                        <CheckSquare className="w-3.5 h-3.5" /> <span>0</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto" title="Last updated">
                        <Clock className="w-3.5 h-3.5" /> 
                        <span>{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <LayoutTemplate className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No projects yet</h3>
                <p className="text-slate-500 max-w-sm mb-8">Create your first project to start organizing tasks and collaborating with your team.</p>
                {isAdminOrOwner && (
                  <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    <Plus className="w-5 h-5" /> Create my first Project
                  </button>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50">
            {/* Loading or Select Org State */}
          </div>
        )}
      </main>
    </div>
  );
}