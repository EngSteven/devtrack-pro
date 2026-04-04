import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { analyticsService, type ProjectMetrics, type TimelineEvent } from '../services/analytics.service';
import toast from 'react-hot-toast';

interface ProjectAnalyticsProps {
  projectId: string;
}

export default function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<ProjectMetrics>({ totalCompleted: 0, avgHoursToComplete: 0 });
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [metricsData, timelineData] = await Promise.all([
          analyticsService.getMetrics(projectId),
          analyticsService.getTimeline(projectId)
        ]);
        setMetrics(metricsData);
        setTimeline(timelineData);
      } catch (error) {
        toast.error('Error loading analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="font-medium">Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8 pr-2">
      
      {/* 1. Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tasks Completed</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{metrics.totalCompleted}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Avg. Resolution Time</p>
            <h3 className="text-3xl font-extrabold text-slate-800">
              {metrics.avgHoursToComplete.toFixed(1)} <span className="text-lg text-slate-400 font-medium tracking-normal">hrs</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Activity Days</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{timeline.length}</h3>
          </div>
        </div>

      </div>

      {/* 2. Gráfico de Línea de Tiempo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 min-h-[400px] flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800">Activity Timeline (Last 7 Days)</h3>
        </div>
        
        {timeline.length > 0 ? (
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="eventsCount" 
                  name="Events"
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Activity className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-bold text-slate-500">No activity data yet.</p>
            <p className="text-sm mt-1">Move tasks on the board to generate analytics.</p>
          </div>
        )}
      </div>

    </div>
  );
}