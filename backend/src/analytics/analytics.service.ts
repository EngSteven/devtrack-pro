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
}