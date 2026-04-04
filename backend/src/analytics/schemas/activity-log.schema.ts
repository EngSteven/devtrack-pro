import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true }) // Mongoose maneja createdAt automáticamente
export class ActivityLog {
  @Prop({ required: true, index: true })
  orgId!: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: true })
  action!: string; // Ej: 'TASK_CREATED', 'TASK_COMPLETED', 'TASK_MOVED'

  // Guardamos un JSON flexible con los detalles del evento
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>; 
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);