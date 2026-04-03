import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Clock, AlertCircle, X, Trash2, Save, User as UserIcon } from 'lucide-react';
import { useTasksStore } from '../store/tasks.store';
import type { Task, TaskStatus, TaskPriority, TeamMember } from '../../../shared/types';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  orgId: string;
  projectId: string;
  teamMembers: TeamMember[]; // 👈 Recibimos los miembros del equipo como Prop
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-orange-50' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-50' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function KanbanBoard({ orgId, projectId, teamMembers }: KanbanBoardProps) {
  const { tasks, isLoading, fetchTasks, moveTask, addTask, editTask, removeTask } = useTasksStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // 👇 ESTADOS PARA EL MODAL DE EDICIÓN
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigneeId: ''
  });

  useEffect(() => { fetchTasks(orgId, projectId); }, [orgId, projectId, fetchTasks]);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(task => task.status === status);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    try {
      await moveTask(orgId, projectId, draggableId, destination.droppableId as TaskStatus);
    } catch (error) { toast.error('Error moving task'); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await addTask(orgId, projectId, newTaskTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success('Task created');
    } catch (error) { toast.error('Error creating task'); }
  };

  // 👇 MANEJADORES DEL MODAL
  const openEditModal = (task: Task) => {
    setEditFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assigneeId: task.assignee?.id || ''
    });
    setEditingTask(task);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editFormData.title.trim()) return;
    
    const loadingToast = toast.loading('Saving changes...');
    try {
      // Preparamos los datos. Si assigneeId está vacío, enviamos null para desasignar.
      const payload = {
        ...editFormData,
        assigneeId: editFormData.assigneeId === '' ? null : editFormData.assigneeId
      };
      
      await editTask(orgId, projectId, editingTask.id, payload);
      setEditingTask(null);
      toast.success('Task updated', { id: loadingToast });
    } catch (error) { toast.error('Error updating task', { id: loadingToast }); }
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    if (window.confirm('Are you sure you want to delete this task forever?')) {
      try {
        await removeTask(orgId, projectId, editingTask.id);
        setEditingTask(null);
        toast.success('Task deleted');
      } catch (error) { toast.error('Error deleting task'); }
    }
  };

  if (isLoading && tasks.length === 0) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading board...</div>;

  return (
    <>
      {/* TABLERO KANBAN */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start">
          {COLUMNS.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div key={column.id} className={`shrink-0 w-80 rounded-2xl flex flex-col max-h-full ${column.color} border border-slate-200/60`}>
                <div className="p-4 flex justify-between items-center border-b border-slate-200/50">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    {column.title} <span className="bg-white/60 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">{columnTasks.length}</span>
                  </h3>
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-4 h-4" /></button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 p-3 overflow-y-auto space-y-3 min-h-37.5 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}>
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              onClick={() => openEditModal(task)} // 👈 ABRIR MODAL AL HACER CLIC
                              className={`bg-white p-4 rounded-xl border cursor-pointer ${snapshot.isDragging ? 'border-indigo-400 shadow-xl shadow-indigo-100 rotate-2 scale-105' : 'border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md'} transition-all`}
                            >
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h4 className="font-semibold text-slate-800 text-sm leading-snug">{task.title}</h4>
                              </div>
                              {task.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}
                              <div className="flex items-center justify-between mt-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                                  {task.priority === 'URGENT' && <AlertCircle className="w-3 h-3" />} {task.priority}
                                </span>
                                {task.assignee ? (
                                <div 
                                  className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold ring-2 ring-white" 
                                  title={task.assignee?.name || 'Asignado'}
                                >
                                  {task.assignee?.name?.charAt(0)?.toUpperCase() || '👤'}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-300" title="Unassigned">
                                    <Clock className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {column.id === 'TODO' && !isAddingTask && (
                        <button onClick={() => setIsAddingTask(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-500 text-sm font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200 mt-2">
                          <Plus className="w-4 h-4" /> Add Task
                        </button>
                      )}

                      {column.id === 'TODO' && isAddingTask && (
                        <form onSubmit={handleCreateTask} className="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm mt-2">
                          <input autoFocus type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="What needs to be done?" className="w-full text-sm outline-none mb-3 placeholder-slate-400 font-medium text-slate-700" />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAddingTask(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1">Cancel</button>
                            <button type="submit" className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Save</button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* 👇 MODAL DE EDICIÓN DE TAREA */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Task Details</h2>
              <button onClick={() => setEditingTask(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto">
              
              {/* Columna Izquierda: Contenido Principal */}
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                  <input type="text" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full text-lg font-bold text-slate-800 px-3 py-2 border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} placeholder="Add more details to this task..." rows={6} className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none resize-none transition-colors" />
                </div>
              </div>

              {/* Columna Derecha: Metadatos */}
              <div className="w-full md:w-64 space-y-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 items-center gap-1"><UserIcon className="w-3 h-3"/> Assignee</label>
                  <select value={editFormData.assigneeId} onChange={e => setEditFormData({...editFormData, assigneeId: e.target.value})} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Unassigned</option>
                    {/* 👇 Mapeamos los miembros del equipo */}
                    {teamMembers.map(member => (
                      <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 items-center gap-1"><AlertCircle className="w-3 h-3"/> Priority</label>
                  <select value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: e.target.value})} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent ⚡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 items-center gap-1"><Clock className="w-3 h-3"/> Status</label>
                  <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-col gap-2 mt-auto">
                  <button type="submit" className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                    <Save className="w-4 h-4"/> Save Changes
                  </button>
                  <button type="button" onClick={handleDeleteTask} className="w-full flex justify-center items-center gap-2 bg-white border border-red-200 text-red-600 font-bold py-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4"/> Delete Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}