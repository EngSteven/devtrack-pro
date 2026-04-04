import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from './schemas/activity-log.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(ActivityLog.name) private logModel: Model<ActivityLogDocument>,
  ) {}

  // Este método será llamado de forma asíncrona por otros servicios (fire-and-forget)
  async logEvent(data: {
    orgId: string;
    projectId: string;
    userId?: string;
    action: string;
    metadata?: any;
  }) {
    try {
      const newLog = new this.logModel(data);
      await newLog.save();
    } catch (error) {
      // Solo registramos el error en consola, no queremos que un fallo 
      // en las métricas interrumpa el flujo principal de la app
      console.error('Failed to log analytics event:', error);
    }
  }

  async getProjectMetrics(projectId: string) {
    const result = await this.logModel.aggregate([
      // Fase 1: Filtramos solo las tareas completadas de este proyecto
      { 
        $match: { 
          projectId: projectId, 
          action: 'TASK_COMPLETED' 
        } 
      },
      // Fase 2: Agrupamos todo en un solo resultado matemático
      { 
        $group: {
          _id: null, // Agrupamos todo junto (no dividimos por categorías)
          totalCompleted: { $sum: 1 }, // Contamos cuántas hay
          avgTimeMs: { $avg: '$metadata.timeToComplete' } // Promediamos el tiempo
        } 
      },
      // Fase 3: Damos formato al resultado
      {
        $project: {
          _id: 0,
          totalCompleted: 1,
          // Convertimos milisegundos a horas para que sea legible (opcional)
          avgHoursToComplete: { $divide: ['$avgTimeMs', 1000 * 60 * 60] }
        }
      }
    ]);

    // Si no hay datos, devolvemos 0
    return result[0] || { totalCompleted: 0, avgHoursToComplete: 0 };
  }

  // Pipeline de Actividad por Días (Para Gráficos)
  async getActivityTimeline(projectId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.logModel.aggregate([
      // Fase 1: Solo eventos de este proyecto en los últimos X días
      {
        $match: {
          projectId: projectId,
          createdAt: { $gte: startDate }
        }
      },
      // Fase 2: Agrupar por Día (formateando la fecha ISO a YYYY-MM-DD)
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          eventsCount: { $sum: 1 }
        }
      },
      // Fase 3: Ordenar por fecha ascendente (del más viejo al más nuevo)
      {
        $sort: { _id: 1 }
      },
      // Fase 4: Renombrar "_id" a "date" para que sea más limpio para el Frontend
      {
        $project: {
          _id: 0,
          date: '$_id',
          eventsCount: 1
        }
      }
    ]);
  }

}