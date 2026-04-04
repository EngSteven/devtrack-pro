import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';

// Usamos tu AuthGuard para proteger los datos
@UseGuards(AuthGuard)
@Controller('projects/:projectId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  getMetrics(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectMetrics(projectId);
  }

  @Get('timeline')
  getTimeline(@Param('projectId') projectId: string) {
    return this.analyticsService.getActivityTimeline(projectId);
  }
}