import { create } from 'zustand';
import type { Task, TaskStatus } from '../../../shared/types';
import { tasksService } from '../services/tasks.service';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchTasks: (orgId: string, projectId: string) => Promise<void>;
  // 1. Actualizamos la firma para incluir newPosition
  moveTask: (orgId: string, projectId: string, taskId: string, newStatus: TaskStatus, newPosition: number) => Promise<void>;
  addTask: (orgId: string, projectId: string, title: string, description?: string) => Promise<void>;
  editTask: (orgId: string, projectId: string, taskId: string, data: any) => Promise<void>;
  removeTask: (orgId: string, projectId: string, taskId: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (orgId, projectId) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await tasksService.getTasks(orgId, projectId);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: 'Error al cargar las tareas', isLoading: false });
    }
  },

  // 2. Agregamos newPosition a la función
  moveTask: async (orgId, projectId, taskId, newStatus, newPosition) => {
    const previousTasks = get().tasks;
    
    // 3. UI Optimista: Cambiamos estado, posición y reordenamos el array completo
    const updatedTasks = previousTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus, position: newPosition } : task
    ).sort((a, b) => a.position - b.position);

    set({ tasks: updatedTasks });

    try {
      // 4. Enviamos la petición al backend en segundo plano con la nueva posición
      await tasksService.updateTask(orgId, projectId, taskId, { status: newStatus, position: newPosition });
    } catch (error) {
      // Si el backend falla, revertimos la tarjeta a su posición original
      set({ tasks: previousTasks });
      console.error('Error al mover la tarea');
    }
  },

  addTask: async (orgId, projectId, title, description) => {
    try {
      const newTask = await tasksService.createTask(orgId, projectId, { title, description, status: 'TODO', priority: 'MEDIUM' });
      // Añadimos la nueva tarea al principio de la lista actual
      set({ tasks: [newTask, ...get().tasks] });
    } catch (error) {
      console.error('Error al crear la tarea');
      throw error;
    }
  },

  editTask: async (orgId, projectId, taskId, data) => {
    try {
      // Mandamos al backend (incluyendo el assigneeId)
      const updatedTask = await tasksService.updateTask(orgId, projectId, taskId, data);
      // Actualizamos la UI con la respuesta real del backend (que ya trae los datos del usuario asignado)
      set({ tasks: get().tasks.map(task => task.id === taskId ? updatedTask : task) });
    } catch (error) { throw error; }
  },

  removeTask: async (orgId, projectId, taskId) => {
    const previousTasks = get().tasks;
    set({ tasks: previousTasks.filter(task => task.id !== taskId) });
    try {
      await tasksService.deleteTask(orgId, projectId, taskId);
    } catch (error) {
      set({ tasks: previousTasks });
      throw error;
    }
  }
}));