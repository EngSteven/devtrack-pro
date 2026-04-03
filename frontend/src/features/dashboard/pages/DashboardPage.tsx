import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationsService } from '../../organizations/services/organizations.service';
import { projectsService } from '../../projects/services/projects.service';
import type { Organization, Project } from '../../../shared/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // Estados principales
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Estados para formularios
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState(''); // Nueva descripción
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectData, setEditProjectData] = useState({ name: '', description: '' });

  // Estados para modales
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (activeOrg) {
      loadProjects(activeOrg.id);
    }
  }, [activeOrg]);

  const loadOrganizations = async () => {
    try {
      const orgs = await organizationsService.getMyOrganizations();
      setOrganizations(orgs);
      // Si la org activa fue borrada, o no hay ninguna seleccionada, tomamos la primera
      if (orgs.length > 0 && (!activeOrg || !orgs.find(o => o.id === activeOrg.id))) {
        setActiveOrg(orgs[0]);
      } else if (orgs.length === 0) {
        setActiveOrg(null);
      }
    } catch (error) {
      console.error('Error loading orgs:', error);
    }
  };

  const loadProjects = async (orgId: string) => {
    try {
      const projs = await projectsService.getProjectsByOrg(orgId);
      setProjects(projs);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      // Creamos la organización
      const newOrg = await organizationsService.createOrganization(newOrgName);
      setNewOrgName('');
      setIsCreatingOrg(false);
      
      // Recargamos la lista y la seteamos como activa
      const orgs = await organizationsService.getMyOrganizations();
      setOrganizations(orgs);
      
      const createdOrg = orgs.find(o => o.id === newOrg.id);
      if (createdOrg) setActiveOrg(createdOrg);
      
    } catch (error) {
      alert('Error al crear la organización. Intenta nuevamente.');
    }
  };

  // --- CRUD ORGANIZACIONES ---
  const handleRenameOrg = async () => {
    if (!activeOrg) return;
    const newName = window.prompt('Nuevo nombre para la organización:', activeOrg.name);
    if (newName && newName.trim() !== '' && newName !== activeOrg.name) {
      try {
        await organizationsService.updateOrganization(activeOrg.id, newName);
        loadOrganizations(); // Recargar para ver el nuevo nombre
      } catch (error) {
        alert('Error al renombrar la organización');
      }
    }
  };

  const handleDeleteOrg = async () => {
    if (!activeOrg) return;
    const confirm = window.confirm(`¿ESTÁS SEGURO? Esto borrará "${activeOrg.name}" y TODOS sus proyectos para siempre.`);
    if (confirm) {
      try {
        await organizationsService.deleteOrganization(activeOrg.id);
        loadOrganizations();
      } catch (error) {
        alert('Error al borrar la organización');
      }
    }
  };

  // --- CRUD PROYECTOS ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newProjectName.trim()) return;

    try {
      await projectsService.createProject(activeOrg.id, newProjectName, newProjectDesc);
      setNewProjectName('');
      setNewProjectDesc('');
      loadProjects(activeOrg.id);
    } catch (error) {
      alert('Error al crear el proyecto');
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!activeOrg || !editProjectData.name.trim()) return;
    try {
      await projectsService.updateProject(activeOrg.id, projectId, editProjectData);
      setEditingProjectId(null); // Salir del modo edición
      loadProjects(activeOrg.id);
    } catch (error) {
      alert('Error al actualizar el proyecto');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!activeOrg) return;
    const confirm = window.confirm(`¿Seguro que deseas eliminar el proyecto "${projectName}"?`);
    if (confirm) {
      try {
        await projectsService.deleteProject(activeOrg.id, projectId);
        loadProjects(activeOrg.id);
      } catch (error) {
        alert('Error al eliminar el proyecto');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devtrack_token');
    navigate('/login');
  };

  // Variables de permisos visuales
  const isOwner = activeOrg?.myRole === 'OWNER';
  const isAdminOrOwner = isOwner || activeOrg?.myRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">DevTrack Pro</h1>
          
        </div>

        <div className="mb-6 flex-1 overflow-y-auto pr-2">
          {/* Header de la lista con el botón '+' */}
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tus Organizaciones</p>
            <button
              onClick={() => setIsCreatingOrg(!isCreatingOrg)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Nueva Organización"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          {/* Formulario en línea para crear */}
          {isCreatingOrg && (
            <form onSubmit={handleCreateOrg} className="mb-4 flex flex-col gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Nombre de la empresa..."
                className="w-full px-3 py-1.5 text-sm rounded bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded transition-colors">Guardar</button>
                <button type="button" onClick={() => setIsCreatingOrg(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-1.5 rounded transition-colors">Cancelar</button>
              </div>
            </form>
          )}

          {/* Lista de Organizaciones */}
          <div className="space-y-1">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => setActiveOrg(org)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeOrg?.id === org.id ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="truncate">{org.name}</div>
              </button>
            ))}
            
            {organizations.length === 0 && !isCreatingOrg && (
              <p className="text-sm text-slate-500 italic px-2">Crea tu primera organización para comenzar.</p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeOrg ? (
          <div className="max-w-5xl mx-auto">
            
            {/* HEADER DE ORGANIZACIÓN Y AJUSTES */}
            <header className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
              <div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase mb-2 inline-block">
                  Rol: {activeOrg.myRole}
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900">{activeOrg.name}</h2>
              </div>
              
              {/* Acciones de Organización (Solo para líderes) */}
              {isAdminOrOwner && (
                <div className="flex gap-2">
                  <button onClick={handleRenameOrg} className="text-sm px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                    Renombrar
                  </button>
                  {isOwner && (
                    <button onClick={handleDeleteOrg} className="text-sm px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
                      Borrar Organización
                    </button>
                  )}
                </div>
              )}
            </header>

            {/* CREAR PROYECTO (Con descripción) */}
            {isAdminOrOwner && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Crear Nuevo Proyecto</h3>
                <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Nombre del proyecto (ej. Alpha)..."
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      placeholder="Descripción corta (opcional)..."
                      className="flex-2 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
                      Crear Proyecto
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* GRID DE PROYECTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col group">
                  
                  {/* MODO EDICIÓN vs MODO LECTURA */}
                  {editingProjectId === project.id ? (
                    <div className="flex flex-col gap-3 flex-1">
                      <input 
                        type="text" 
                        value={editProjectData.name} 
                        onChange={e => setEditProjectData({...editProjectData, name: e.target.value})}
                        className="w-full px-3 py-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                      />
                      <textarea 
                        value={editProjectData.description} 
                        onChange={e => setEditProjectData({...editProjectData, description: e.target.value})}
                        className="w-full px-3 py-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none text-sm resize-none h-20"
                      />
                      <div className="flex gap-2 mt-auto pt-2">
                        <button onClick={() => handleUpdateProject(project.id)} className="flex-1 bg-green-500 text-white text-xs py-2 rounded font-bold hover:bg-green-600">Guardar</button>
                        <button onClick={() => setEditingProjectId(null)} className="flex-1 bg-slate-200 text-slate-700 text-xs py-2 rounded font-bold hover:bg-slate-300">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800 wrap-break-words pr-2">{project.name}</h3>
                        <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${project.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      </div>
                      
                      <p className="text-slate-500 text-sm mb-4 flex-1">
                        {project.description || <span className="italic text-slate-300">Sin descripción</span>}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <div className="text-xs font-medium text-slate-400">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        
                        {/* Botones de acción ocultos hasta hacer hover (Solo Admin/Owner) */}
                        {isAdminOrOwner && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingProjectId(project.id);
                                setEditProjectData({ name: project.name, description: project.description || '' });
                              }} 
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteProject(project.id, project.name)} 
                              className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                              Borrar
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-lg mb-4">No tienes organizaciones seleccionadas.</p>
              {/* Opcional: Un botón para crear su primera organización desde el frontend podría ir aquí */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}