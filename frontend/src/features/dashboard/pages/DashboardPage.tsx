import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Plus, Building2, MoreVertical, LayoutTemplate, 
  Users, CheckSquare, Clock, LogOut, Settings,
  Edit2, Trash2, X, UserPlus, Shield, Bell, Check, User as UserIcon
} from 'lucide-react';
import { organizationsService } from '../../organizations/services/organizations.service';
import { projectsService } from '../../projects/services/projects.service';
import { teamService } from '../../organizations/services/team.service';
import type { Organization, Project, TeamMember, Invitation } from '../../../shared/types';

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
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER' });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // 👇 NUEVO: Estado para el menú de usuario en la esquina inferior izquierda
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => { 
    loadOrganizations(); 
    loadInvitations(); 
  }, []);
  
  useEffect(() => { 
    if (activeOrg) {
      loadProjects(activeOrg.id);
      loadTeamMembers(activeOrg.id);
    } 
  }, [activeOrg]);

  // --- CARGA DE DATOS ---
  const loadOrganizations = async () => {
    try {
      const orgs = await organizationsService.getMyOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0 && (!activeOrg || !orgs.find(o => o.id === activeOrg.id))) {
        setActiveOrg(orgs[0]);
      } else if (orgs.length === 0) {
        setActiveOrg(null);
      }
    } catch (error) { toast.error('Error loading organizations'); }
  };

  const loadProjects = async (orgId: string) => {
    try {
      const projs = await projectsService.getProjectsByOrg(orgId);
      setProjects(projs);
    } catch (error) { toast.error('Error loading projects'); }
  };

  const loadInvitations = async () => {
    try {
      const invs = await organizationsService.getMyInvitations();
      setInvitations(invs);
    } catch (error) { console.error('Error loading invitations', error); }
  };

  const handleRespondInvite = async (membershipId: string, accept: boolean) => {
    const loadingToast = toast.loading(accept ? 'Accepting...' : 'Rejecting...');
    try {
      await organizationsService.respondToInvitation(membershipId, accept);
      loadInvitations(); 
      if (accept) {
        await loadOrganizations(); 
        toast.success('Welcome to the team!', { id: loadingToast });
      } else {
        toast.success('Invitation declined', { id: loadingToast });
      }
      setIsNotificationsOpen(false);
    } catch (error) {
      toast.error('Error responding to invitation', { id: loadingToast });
    }
  };

  // --- ORGANIZACIONES CRUD ---
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
    } catch (error) { toast.error('Error creating organization', { id: loadingToast }); }
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
      } catch (error) { toast.error('Error renaming organization', { id: loadingToast }); }
    }
  };

  const handleDeleteOrg = async () => {
    setIsOrgMenuOpen(false);
    if (!activeOrg) return;
    const confirm = window.confirm(`⚠️ ARE YOU SURE? This will permanently delete "${activeOrg.name}".`);
    if (confirm) {
      const loadingToast = toast.loading('Deleting organization...');
      try {
        await organizationsService.deleteOrganization(activeOrg.id);
        loadOrganizations();
        toast.success('Organization deleted', { id: loadingToast });
      } catch (error) { toast.error('Error deleting organization', { id: loadingToast }); }
    }
  };

  const handleLeaveOrg = async () => {
    setIsOrgMenuOpen(false);
    if (!activeOrg) return;
    const confirm = window.confirm(`Are you sure you want to leave "${activeOrg.name}"? You will lose access to all its projects.`);
    if (confirm) {
      const loadingToast = toast.loading('Leaving organization...');
      try {
        await organizationsService.leaveOrganization(activeOrg.id);
        setActiveOrg(null); 
        await loadOrganizations(); 
        toast.success('You have left the organization', { id: loadingToast });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error leaving organization', { id: loadingToast });
      }
    }
  };

  // --- EQUIPO ---
  const loadTeamMembers = async (orgId: string) => {
    try {
      const members = await teamService.getMembers(orgId);
      setTeamMembers(members);
    } catch (error) { console.error('Error loading team', error); }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !inviteData.email.trim()) return;
    const loadingToast = toast.loading('Inviting user...');
    try {
      await teamService.addMember(activeOrg.id, inviteData.email, inviteData.role);
      setInviteData({ email: '', role: 'MEMBER' });
      loadTeamMembers(activeOrg.id);
      toast.success('Invitation sent!', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error inviting user', { id: loadingToast });
    }
  };

  const handleChangeRole = async (membershipId: string, newRole: string) => {
    if (!activeOrg) return;
    const loadingToast = toast.loading('Updating role...');
    try {
      await teamService.updateMemberRole(activeOrg.id, membershipId, newRole);
      loadTeamMembers(activeOrg.id); 
      toast.success('Role updated successfully', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating role', { id: loadingToast });
    }
  };

  const handleRemoveMember = async (membershipId: string, memberName: string) => {
    if (!activeOrg) return;
    if (window.confirm(`Remove ${memberName} from the organization?`)) {
      const loadingToast = toast.loading('Removing user...');
      try {
        await teamService.removeMember(activeOrg.id, membershipId);
        loadTeamMembers(activeOrg.id);
        toast.success('User removed', { id: loadingToast });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error removing user', { id: loadingToast });
      }
    }
  };

  // --- PROYECTOS CRUD ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newProjectData.name.trim()) return;
    const loadingToast = toast.loading('Creating project...');
    try {
      await projectsService.createProject(activeOrg.id, newProjectData.name, newProjectData.description);
      setNewProjectData({ name: '', description: '' });
      setIsCreatingProject(false);
      loadProjects(activeOrg.id);
      toast.success('Project created', { id: loadingToast });
    } catch (error) { toast.error('Error creating project', { id: loadingToast }); }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!activeOrg) return;
    if (window.confirm(`Delete the project "${projectName}"?`)) {
      try {
        await projectsService.deleteProject(activeOrg.id, projectId);
        loadProjects(activeOrg.id);
        toast.success('Project deleted');
      } catch (error) { toast.error('Error deleting project'); }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devtrack_token');
    navigate('/login');
  };

  const isOwner = activeOrg?.myRole === 'OWNER';
  const isAdminOrOwner = isOwner || activeOrg?.myRole === 'ADMIN';

  return (
    <div className="h-screen w-full bg-slate-50 flex text-slate-900 font-sans overflow-hidden relative">
      <Toaster position="top-right" />

      {/* SIDEBAR */}
      <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-xl z-20 border-r border-slate-800">
        
        {/* 👇 NUEVO HEADER DEL SIDEBAR: Aquí vive ahora la campana global */}
        <div className="p-6 pb-4 shrink-0 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">DevTrack<span className="text-indigo-400">Pro</span></h1>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              onBlur={() => setTimeout(() => setIsNotificationsOpen(false), 200)}
              className="relative p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
              {invitations.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-900"></span>
              )}
            </button>

            {/* Dropdown de Invitaciones (Ajustado para no salirse del Sidebar) */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-white">Invitations</h4>
                  <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{invitations.length}</span>
                </div>
                
                {invitations.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">No new notifications</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                    {invitations.map(inv => (
                      <div key={inv.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700 transition-colors">
                        {/* Texto resumido para que encaje perfecto en w-56 */}
                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                          Join <span className="font-bold text-white">{inv.organization.name}</span> as <span className="font-semibold text-indigo-400">{inv.role}</span>.
                        </p>
                        <div className="flex gap-2">
                          <button onMouseDown={(e) => { e.preventDefault(); handleRespondInvite(inv.id, true); }} className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-500 transition-colors">
                            <Check className="w-3.5 h-3.5"/> Accept
                          </button>
                          <button onMouseDown={(e) => { e.preventDefault(); handleRespondInvite(inv.id, false); }} className="flex-1 flex items-center justify-center gap-1 bg-slate-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-slate-500 transition-colors">
                            <X className="w-3.5 h-3.5"/> Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* LISTA DE ORGANIZACIONES */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex justify-between items-center mb-3 px-2 mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</p>
            <button onClick={() => setIsCreatingOrg(!isCreatingOrg)} className="text-slate-400 hover:text-white transition-colors" title="New Organization"><Plus className="w-4 h-4" /></button>
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

        {/* 👇 NUEVO FOOTER: Menú de Usuario Dinámico */}
        <div className="p-4 border-t border-slate-800 shrink-0 mt-auto bg-slate-900 relative">
          
          {/* Popover Menu (Drop-up) */}
          {isUserMenuOpen && (
            <div className="absolute bottom-[calc(100%-10px)] left-4 w-[calc(100%-32px)] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={() => { setIsUserMenuOpen(false); /* Lógica futura de perfil */ }} 
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4" /> Profile & Settings
              </button>
              <div className="h-px bg-slate-700 my-1 mx-2"></div>
              <button 
                onClick={handleLogout} 
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          )}

          {/* Botón Principal del Perfil */}
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              U
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">Your Account</p>
              <p className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition-colors">Manage profile</p>
            </div>
            <MoreVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto relative">
        {activeOrg ? (
          <div className="max-w-6xl mx-auto p-8 md:p-12">
            
            <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeOrg.name}</h2>
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {activeOrg.myRole}
                  </span>
                </div>
                <p className="text-slate-500">Manage your projects and team activity</p>
              </div>
              
              <div className="flex items-center gap-3">
                
                <button onClick={() => setIsTeamModalOpen(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                  <Users className="w-5 h-5 text-indigo-500" /> Team
                </button>

                {isAdminOrOwner && (
                  <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> New Project
                  </button>
                )}
                
                <div className="relative">
                  <button onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)} onBlur={() => setTimeout(() => setIsOrgMenuOpen(false), 200)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border border-transparent hover:border-slate-300">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {isOrgMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                      {isAdminOrOwner && (
                        <button onClick={handleRenameOrg} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit2 className="w-4 h-4" /> Rename Org</button>
                      )}
                      <button onClick={handleLeaveOrg} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Leave Organization</button>
                      {isOwner && (
                        <button onClick={handleDeleteOrg} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"><Trash2 className="w-4 h-4" /> Delete Org</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </header>

            {isCreatingProject && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50 mb-10 transform transition-all animate-in fade-in slide-in-from-top-4 relative z-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">New Project Details</h3>
                  <button onClick={() => setIsCreatingProject(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4">
                  <input autoFocus type="text" value={newProjectData.name} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} placeholder="E.g., Cloud Migration..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  <input type="text" value={newProjectData.description} onChange={e => setNewProjectData({...newProjectData, description: e.target.value})} placeholder="Short description (optional)..." className="flex-[2] px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors whitespace-nowrap">Create</button>
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
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, project.name); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2 leading-relaxed">{project.description || 'No detailed description provided.'}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-auto pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> <span>0</span></div>
                      <div className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> <span>0</span></div>
                      <div className="flex items-center gap-1.5 ml-auto"><Clock className="w-3.5 h-3.5" /> <span>{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6"><LayoutTemplate className="w-10 h-10 text-indigo-300" /></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No projects yet</h3>
                <p className="text-slate-500 max-w-sm mb-8">Create your first project to start organizing tasks and collaborating with your team.</p>
                {isAdminOrOwner && (
                  <button onClick={() => setIsCreatingProject(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"><Plus className="w-5 h-5" /> Create my first Project</button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4"><Building2 className="w-8 h-8 text-slate-400"/></div>
            <p className="text-slate-500 font-medium">Select or create an organization to begin.</p>
          </div>
        )}
      </main>

      {/* TEAM MODAL */}
      {isTeamModalOpen && activeOrg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-600" /> Team Management</h2>
                <p className="text-slate-500 text-sm mt-1">{activeOrg.name} Members</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {isAdminOrOwner && (
                <div className="mb-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite new member</h3>
                  <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                    <input type="email" placeholder="user@example.com" value={inviteData.email} onChange={(e) => setInviteData({...inviteData, email: e.target.value})} className="flex-1 px-4 py-2.5 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <select value={inviteData.role} onChange={(e) => setInviteData({...inviteData, role: e.target.value})} className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none min-w-[140px]">
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap">Send Invite</button>
                  </form>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Active & Pending Members</h3>
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <div key={member.membershipId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800">{member.user.name}</p>
                            {/* Mostramos si la invitación está pendiente basándonos en si tiene la propiedad status (o lo inferimos si fuera necesario, aunque el backend retorna todos. Por simplicidad visual asumimos activos si no hay error) */}
                          </div>
                          <p className="text-sm text-slate-500">{member.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        
                        {/* 👇 NUEVO: SELECTOR DE ROLES */}
                        {isAdminOrOwner && member.role !== 'OWNER' ? (
                          <select 
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.membershipId, e.target.value)}
                            className="text-xs font-bold px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-transparent hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                            <Shield className="w-3.5 h-3.5" /> {member.role}
                          </span>
                        )}
                        
                        {isAdminOrOwner && member.role !== 'OWNER' && (
                          <button onClick={() => handleRemoveMember(member.membershipId, member.user.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove user"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}