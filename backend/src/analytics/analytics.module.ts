import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { AnalyticsController } from './analytics.controller';

@Global() // Lo hacemos Global para inyectarlo en cualquier parte sin tener que importarlo en cada módulo
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ActivityLog.name, schema: ActivityLogSchema }])
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}